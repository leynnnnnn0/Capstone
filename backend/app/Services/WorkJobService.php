<?php
// app/Services/WorkJobService.php

namespace App\Services;

use App\Enums\WorkJobBackJobReason;
use App\Enums\WorkJobStatus;
use App\Events\WorkJobChanged;
use App\Exceptions\InvalidStatusTransitionException;
use App\Models\Appointment;
use App\Models\User;
use App\Models\WorkJob;
use App\Services\Customer\CustomerAccountResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkJobService
{
    public function __construct(
        private readonly CustomerAccountResolver $customerAccountResolver,
        private readonly WorkJobWarrantyService $warrantyService
    ) {}

    /**
     * Create an installation/service work job.
     *
     * Work jobs are the operational record after quotation/appointment approval:
     * assigned workers, schedule, customer location, payment requirements, and
     * status tracking all live here.
     */
    public function create(array $data, ?User $actor = null): WorkJob
    {
        $customerId = $this->resolveCustomerId($data, $actor);

        $workJob = DB::transaction(function () use ($data, $actor, $customerId) {
            $workerIds = $data['worker_ids'];

            $workJob = WorkJob::create([
                'appointment_id'       => $data['appointment_id'] ?? null,
                'quotation_id'         => $data['quotation_id'] ?? null,
                'user_id'              => $customerId,
                'first_name'           => $data['first_name'],
                'last_name'            => $data['last_name'],
                'phone_number'         => $data['phone_number'],
                'email'                => $data['email'] ?? null,
                'address'              => $data['address'] ?? null,
                'address_pinned'       => $data['address_pinned'] ?? null,
                'address_lat'          => $data['address_lat'] ?? null,
                'address_lng'          => $data['address_lng'] ?? null,
                'service_type'         => $data['service_type'],
                'service_type_other'   => $data['service_type_other'] ?? null,
                'scheduled_date'       => $data['scheduled_date'],
                'scheduled_time_from'  => $data['scheduled_time_from'],
                'scheduled_time_until' => $data['scheduled_time_until'],
                'status'               => WorkJobStatus::Pending,
                'notes'                => $data['notes'] ?? null,
                'is_down_payment_required' => (bool) ($data['is_down_payment_required'] ?? false),
                'down_payment_percentage' => $data['down_payment_percentage'] ?? 20,
            ]);

            $workJob->workers()->sync($workerIds);

            if ($workJob->appointment_id) {
                $workJob->appointment?->remarks()->create([
                    'user_id' => $actor?->id,
                    'action' => 'work_job_created',
                    'message' => "Work job {$workJob->work_job_number} was created from this appointment.",
                ]);
            }

            return $workJob->load($this->relations());
        });

        WorkJobChanged::dispatch($workJob, 'created', 'Work job created and scheduled.', $actor);

        return $workJob;
    }

    /**
     * Convert a confirmed appointment into a work job using appointment details.
     */
    public function createFromAppointment(Appointment $appointment, ?User $actor = null): WorkJob
    {
        $appointment->load(['workers', 'quotation']);

        return $this->create([
            'appointment_id'       => $appointment->id,
            'quotation_id'         => $appointment->quotation?->id,
            'first_name'           => $appointment->first_name,
            'last_name'            => $appointment->last_name,
            'phone_number'         => $appointment->phone_number,
            'email'                => $appointment->email,
            'address'              => $appointment->address,
            'address_pinned'       => $appointment->address_pinned,
            'address_lat'          => $appointment->address_lat,
            'address_lng'          => $appointment->address_lng,
            'service_type'         => $appointment->service_type,
            'service_type_other'   => $appointment->service_type_other,
            'scheduled_date'       => $appointment->appointment_date,
            'scheduled_time_from'  => $appointment->appointment_time_from,
            'scheduled_time_until' => $appointment->appointment_time_until,
            'worker_ids'           => $appointment->workers->pluck('id')->toArray(),
            'is_down_payment_required' => false,
            'down_payment_percentage' => 20,
        ], $actor);
    }

    /**
     * Create follow-up work connected to an existing work job.
     *
     * Back jobs are used for unfinished work, repairs, warranty follow-ups, or
     * other return visits while keeping the original job history intact.
     */
    public function createBackJob(WorkJob $source, array $data, User $actor): WorkJob
    {
        $this->ensureCanCreateBackJob($source, WorkJobBackJobReason::from($data['back_job_reason']));
        $customerId = $source->user_id
            ?: $source->appointment?->user_id
            ?: $this->customerAccountResolver->resolveForBooking([
                'first_name' => $source->first_name,
                'last_name' => $source->last_name,
                'email' => $source->email,
                'phone_number' => $source->phone_number,
            ])->id;

        $backJob = DB::transaction(function () use ($source, $data, $actor, $customerId) {
            $reason = WorkJobBackJobReason::from($data['back_job_reason']);

            $workJob = WorkJob::create([
                'appointment_id'       => $source->appointment_id,
                'quotation_id'         => $source->quotation_id,
                'parent_work_job_id'   => $source->id,
                'user_id'              => $customerId,
                'first_name'           => $source->first_name,
                'last_name'            => $source->last_name,
                'phone_number'         => $source->phone_number,
                'email'                => $source->email,
                'address'              => $source->address,
                'address_pinned'       => $source->address_pinned,
                'address_lat'          => $source->address_lat,
                'address_lng'          => $source->address_lng,
                'service_type'         => $source->service_type,
                'service_type_other'   => $source->service_type_other,
                'scheduled_date'       => $data['scheduled_date'],
                'scheduled_time_from'  => $data['scheduled_time_from'],
                'scheduled_time_until' => $data['scheduled_time_until'],
                'status'               => WorkJobStatus::Pending,
                'back_job_reason'      => $reason,
                'back_job_reason_other' => $data['back_job_reason_other'] ?? null,
                'back_job_details'     => $data['back_job_details'],
                'notes'                => $data['notes'] ?? $source->notes,
                'is_down_payment_required' => false,
                'down_payment_percentage' => 20,
            ]);

            $workJob->refresh();
            $workJob->workers()->sync($data['worker_ids']);

            $source->remarks()->create([
                'user_id' => $actor->id,
                'action' => 'back_job_created',
                'message' => $this->backJobCreatedMessage($workJob, $reason, $data['back_job_details']),
            ]);

            $workJob->remarks()->create([
                'user_id' => $actor->id,
                'action' => 'back_job_created',
                'message' => "Created as a back job from {$source->work_job_number}.",
            ]);

            return $workJob->load($this->relations());
        });

        WorkJobChanged::dispatch($backJob, 'back_job_created', "Back job {$backJob->work_job_number} was scheduled.", $actor);

        return $backJob;
    }

    /**
     * Move the job into active work and add a status remark.
     */
    public function markInProgress(WorkJob $workJob, User $actor, ?string $remarks = null): WorkJob
    {
        $this->ensureCanTransition($workJob, WorkJobStatus::InProgress);
        DB::transaction(function () use ($workJob, $actor, $remarks) {
            $workJob->update(['status' => WorkJobStatus::InProgress]);

            $workJob->remarks()->create([
                'user_id' => $actor->id,
                'action' => WorkJobStatus::InProgress->value,
                'message' => $remarks ?: 'Work job is now in progress.',
            ]);
        });

        $workJob = $workJob->fresh()->load($this->relations());
        WorkJobChanged::dispatch($workJob, WorkJobStatus::InProgress->value, $remarks ?: 'Work job is now in progress.', $actor);

        return $workJob;
    }

    /**
     * Complete a job and issue warranty coverage.
     */
    public function complete(WorkJob $workJob, User $actor, ?string $remarks = null): WorkJob
    {
        $this->ensureCanTransition($workJob, WorkJobStatus::Completed);
        DB::transaction(function () use ($workJob, $actor, $remarks) {
            $workJob->update(['status' => WorkJobStatus::Completed]);

            $workJob->remarks()->create([
                'user_id' => $actor->id,
                'action' => WorkJobStatus::Completed->value,
                'message' => $remarks ?: 'Work job completed.',
            ]);
        });

        $this->warrantyService->issueForCompletedWorkJob($workJob->fresh(), $actor);

        $workJob = $workJob->fresh()->load($this->relations());
        WorkJobChanged::dispatch($workJob, WorkJobStatus::Completed->value, $remarks ?: 'Work job completed.', $actor);

        return $workJob;
    }

    /**
     * Cancel a scheduled or active work job.
     */
    public function cancel(WorkJob $workJob, User $actor, ?string $remarks = null): WorkJob
    {
        $this->ensureCanTransition($workJob, WorkJobStatus::Cancelled);
        DB::transaction(function () use ($workJob, $actor, $remarks) {
            $workJob->update(['status' => WorkJobStatus::Cancelled]);

            $workJob->remarks()->create([
                'user_id' => $actor->id,
                'action' => WorkJobStatus::Cancelled->value,
                'message' => $remarks ?: 'Work job cancelled.',
            ]);
        });

        $workJob = $workJob->fresh()->load($this->relations());
        WorkJobChanged::dispatch($workJob, WorkJobStatus::Cancelled->value, $remarks ?: 'Work job cancelled.', $actor);

        return $workJob;
    }

    /**
     * Guard status transitions using the WorkJobStatus enum rules.
     */
    private function ensureCanTransition(WorkJob $workJob, WorkJobStatus $next): void
    {
        if (!$workJob->status->canTransitionTo($next)) {
            throw new InvalidStatusTransitionException(
                "Cannot move from {$workJob->status->label()} to {$next->label()}."
            );
        }
    }

    /**
     * Guard when back jobs are allowed and which reasons are valid.
     */
    private function ensureCanCreateBackJob(WorkJob $source, WorkJobBackJobReason $reason): void
    {
        if (! in_array($source->status, [WorkJobStatus::InProgress, WorkJobStatus::Completed], true)) {
            throw ValidationException::withMessages([
                'work_job' => 'A back job can only be created from an in-progress or completed work job.',
            ]);
        }

        if ($source->status === WorkJobStatus::InProgress && $reason !== WorkJobBackJobReason::UnfinishedWork) {
            throw ValidationException::withMessages([
                'back_job_reason' => 'Only unfinished work can create a back job while the original work job is still in progress.',
            ]);
        }
    }

    private function backJobCreatedMessage(WorkJob $backJob, WorkJobBackJobReason $reason, string $details): string
    {
        return "Back job {$backJob->work_job_number} scheduled ({$reason->label()}). {$details}";
    }

    private function resolveCustomerId(array $data, ?User $actor): int
    {
        $appointment = null;

        if (! empty($data['appointment_id'])) {
            $appointment = Appointment::query()->find($data['appointment_id']);

            if ($appointment?->user_id) {
                return (int) $appointment->user_id;
            }
        }

        $customer = $this->customerAccountResolver->resolveForBooking($data, $actor);

        if ($appointment && ! $appointment->user_id) {
            $appointment->update(['user_id' => $customer->id]);
        }

        return (int) $customer->id;
    }

    private function relations(): array
    {
        return [
            'workers',
            'appointment.workJob',
            'parentWorkJob.workers',
            'backJobs.workers',
            'quotation.quotation_items.options',
            'quotation.quotation_items.product.product_images',
            'quotation.quotation_items.before_images',
            'quotation.quotation_items.after_images',
            'payments.payer',
            'payments.creator',
            'warranty.issuedBy',
            'remarks.user',
        ];
    }
}
