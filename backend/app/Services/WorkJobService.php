<?php

// app/Services/WorkJobService.php

namespace App\Services;

use App\Enums\FabricationStatus;
use App\Enums\WorkJobBackJobReason;
use App\Enums\WorkJobStatus;
use App\Events\WorkJobChanged;
use App\Events\WorkJobCreated;
use App\Events\WorkJobFabricationUpdated;
use App\Events\WorkJobStatusChanged;
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
        private readonly WorkJobWarrantyService $warrantyService,
        private readonly WorkerService $workerService
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
        $fabricationStatus = isset($data['fabrication_status'])
            ? FabricationStatus::from($data['fabrication_status'])
            : $this->defaultFabricationStatus($data['service_type']);
        $this->ensureWorkersAvailable(
            $data['worker_ids'],
            $data['scheduled_date'],
            $data['scheduled_time_from'],
            $data['scheduled_time_until'],
            $data['appointment_id'] ?? null
        );

        $workJob = DB::transaction(function () use ($data, $actor, $customerId, $fabricationStatus) {
            $workerIds = $data['worker_ids'];

            $workJob = WorkJob::create([
                'appointment_id' => $data['appointment_id'] ?? null,
                'quotation_id' => $data['quotation_id'] ?? null,
                'user_id' => $customerId,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone_number' => $data['phone_number'],
                'email' => $data['email'] ?? null,
                'address' => $data['address'] ?? null,
                'address_pinned' => $data['address_pinned'] ?? null,
                'address_lat' => $data['address_lat'] ?? null,
                'address_lng' => $data['address_lng'] ?? null,
                'service_type' => $data['service_type'],
                'service_type_other' => $data['service_type_other'] ?? null,
                'scheduled_date' => $data['scheduled_date'],
                'scheduled_time_from' => $data['scheduled_time_from'],
                'scheduled_time_until' => $data['scheduled_time_until'],
                'status' => WorkJobStatus::Confirmed,
                'fabrication_status' => $fabricationStatus,
                'fabrication_expected_completion_date' => $fabricationStatus === FabricationStatus::NotRequired
                    ? null
                    : ($data['fabrication_expected_completion_date'] ?? null),
                'fabrication_notes' => $data['fabrication_notes'] ?? null,
                'fabrication_updated_at' => now(),
                'notes' => $data['notes'] ?? null,
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
        WorkJobCreated::dispatch($workJob, $actor);

        return $workJob;
    }

    public function update(WorkJob $workJob, array $data, ?User $actor = null): WorkJob
    {
        $customerId = $this->resolveCustomerId($data, $actor);
        $this->ensureWorkersAvailable(
            $data['worker_ids'],
            $data['scheduled_date'],
            $data['scheduled_time_from'],
            $data['scheduled_time_until'],
            $data['appointment_id'] ?? null,
            $workJob->id
        );

        $workJob = DB::transaction(function () use ($workJob, $data, $actor, $customerId) {
            $fabricationStatus = isset($data['fabrication_status'])
                ? FabricationStatus::from($data['fabrication_status'])
                : $workJob->fabrication_status;

            $workJob->update([
                'appointment_id' => $data['appointment_id'] ?? null,
                'quotation_id' => $data['quotation_id'] ?? null,
                'user_id' => $customerId,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone_number' => $data['phone_number'],
                'email' => $data['email'] ?? null,
                'address' => $data['address'] ?? null,
                'address_pinned' => $data['address_pinned'] ?? null,
                'address_lat' => $data['address_lat'] ?? null,
                'address_lng' => $data['address_lng'] ?? null,
                'service_type' => $data['service_type'],
                'service_type_other' => $data['service_type_other'] ?? null,
                'scheduled_date' => $data['scheduled_date'],
                'scheduled_time_from' => $data['scheduled_time_from'],
                'scheduled_time_until' => $data['scheduled_time_until'],
                'fabrication_status' => $fabricationStatus,
                'fabrication_expected_completion_date' => $fabricationStatus === FabricationStatus::NotRequired
                    ? null
                    : ($data['fabrication_expected_completion_date'] ?? $workJob->fabrication_expected_completion_date),
                'fabrication_notes' => $fabricationStatus === FabricationStatus::NotRequired
                    ? null
                    : ($data['fabrication_notes'] ?? $workJob->fabrication_notes),
                'fabrication_started_at' => $fabricationStatus === FabricationStatus::NotRequired
                    ? null
                    : $workJob->fabrication_started_at,
                'fabrication_completed_at' => $fabricationStatus === FabricationStatus::NotRequired
                    ? null
                    : $workJob->fabrication_completed_at,
                'fabrication_updated_at' => isset($data['fabrication_status']) ? now() : $workJob->fabrication_updated_at,
                'notes' => $data['notes'] ?? null,
                'is_down_payment_required' => (bool) ($data['is_down_payment_required'] ?? false),
                'down_payment_percentage' => $data['down_payment_percentage'] ?? 20,
            ]);

            $workJob->workers()->sync($data['worker_ids']);

            if ($actor) {
                $workJob->remarks()->create([
                    'user_id' => $actor->id,
                    'action' => 'work_job_updated',
                    'message' => 'Work job details updated.',
                ]);
            }

            return $workJob->fresh()->load($this->relations());
        });

        WorkJobChanged::dispatch($workJob, 'updated', 'Work job details updated.', $actor);

        return $workJob;
    }

    /**
     * Convert a confirmed appointment into a work job using appointment details.
     */
    public function createFromAppointment(Appointment $appointment, ?User $actor = null): WorkJob
    {
        $appointment->load(['workers', 'quotation']);

        return $this->create([
            'appointment_id' => $appointment->id,
            'quotation_id' => $appointment->quotation?->id,
            'first_name' => $appointment->first_name,
            'last_name' => $appointment->last_name,
            'phone_number' => $appointment->phone_number,
            'email' => $appointment->email,
            'address' => $appointment->address,
            'address_pinned' => $appointment->address_pinned,
            'address_lat' => $appointment->address_lat,
            'address_lng' => $appointment->address_lng,
            'service_type' => $appointment->service_type,
            'service_type_other' => $appointment->service_type_other,
            'scheduled_date' => $appointment->appointment_date,
            'scheduled_time_from' => $appointment->appointment_time_from,
            'scheduled_time_until' => $appointment->appointment_time_until,
            'worker_ids' => $appointment->workers->pluck('id')->toArray(),
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
        $this->ensureWorkersAvailable(
            $data['worker_ids'],
            $data['scheduled_date'],
            $data['scheduled_time_from'],
            $data['scheduled_time_until']
        );

        $backJob = DB::transaction(function () use ($source, $data, $actor, $customerId) {
            $reason = WorkJobBackJobReason::from($data['back_job_reason']);

            $workJob = WorkJob::create([
                'appointment_id' => $source->appointment_id,
                'quotation_id' => $source->quotation_id,
                'parent_work_job_id' => $source->id,
                'user_id' => $customerId,
                'first_name' => $source->first_name,
                'last_name' => $source->last_name,
                'phone_number' => $source->phone_number,
                'email' => $source->email,
                'address' => $source->address,
                'address_pinned' => $source->address_pinned,
                'address_lat' => $source->address_lat,
                'address_lng' => $source->address_lng,
                'service_type' => $source->service_type,
                'service_type_other' => $source->service_type_other,
                'scheduled_date' => $data['scheduled_date'],
                'scheduled_time_from' => $data['scheduled_time_from'],
                'scheduled_time_until' => $data['scheduled_time_until'],
                'status' => WorkJobStatus::Confirmed,
                'fabrication_status' => FabricationStatus::NotRequired,
                'fabrication_updated_at' => now(),
                'back_job_reason' => $reason,
                'back_job_reason_other' => $data['back_job_reason_other'] ?? null,
                'back_job_details' => $data['back_job_details'],
                'notes' => $data['notes'] ?? $source->notes,
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
    public function confirm(WorkJob $workJob, User $actor, ?string $remarks = null): WorkJob
    {
        return $this->transition(
            $workJob,
            WorkJobStatus::Confirmed,
            $actor,
            $remarks ?: 'Work job confirmed.'
        );
    }

    public function reschedule(WorkJob $workJob, array $data, User $actor): WorkJob
    {
        $this->ensureCanTransition($workJob, WorkJobStatus::Rescheduled);
        $workerIds = $data['worker_ids'] ?? $workJob->workers()->pluck('users.id')->all();
        $this->ensureWorkersAvailable(
            $workerIds,
            $data['scheduled_date'],
            $data['scheduled_time_from'],
            $data['scheduled_time_until'],
            null,
            $workJob->id
        );

        $message = $data['reason'] ?? 'Work job rescheduled.';

        DB::transaction(function () use ($workJob, $data, $actor, $message) {
            $workJob->update([
                'status' => WorkJobStatus::Rescheduled,
                'scheduled_date' => $data['scheduled_date'],
                'scheduled_time_from' => $data['scheduled_time_from'],
                'scheduled_time_until' => $data['scheduled_time_until'],
            ]);

            if (isset($data['worker_ids'])) {
                $workJob->workers()->sync($data['worker_ids']);
            }

            $workJob->remarks()->create([
                'user_id' => $actor->id,
                'action' => WorkJobStatus::Rescheduled->value,
                'message' => $message,
            ]);
        });

        $workJob = $workJob->fresh()->load($this->relations());
        WorkJobChanged::dispatch($workJob, WorkJobStatus::Rescheduled->value, $message, $actor);
        WorkJobStatusChanged::dispatch($workJob, WorkJobStatus::Rescheduled, $message, $actor);

        return $workJob;
    }

    public function markOnTheWay(WorkJob $workJob, User $actor, ?string $remarks = null): WorkJob
    {
        return $this->transition(
            $workJob,
            WorkJobStatus::OnTheWay,
            $actor,
            $remarks ?: 'Worker is on the way.'
        );
    }

    public function markInProgress(WorkJob $workJob, User $actor, ?string $remarks = null): WorkJob
    {
        return $this->transition(
            $workJob,
            WorkJobStatus::InProgress,
            $actor,
            $remarks ?: 'Work job is now in progress.'
        );
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
        WorkJobStatusChanged::dispatch($workJob, WorkJobStatus::Completed, $remarks ?: 'Work job completed.', $actor);

        return $workJob;
    }

    /**
     * Cancel a scheduled or active work job.
     */
    public function cancel(WorkJob $workJob, User $actor, ?string $remarks = null): WorkJob
    {
        return $this->transition(
            $workJob,
            WorkJobStatus::Cancelled,
            $actor,
            $remarks ?: 'Work job cancelled.'
        );
    }

    public function reopen(WorkJob $workJob, User $actor, ?string $remarks = null): WorkJob
    {
        return $this->transition(
            $workJob,
            WorkJobStatus::Reopened,
            $actor,
            $remarks ?: 'Work job reopened.'
        );
    }

    public function markNoShow(WorkJob $workJob, User $actor, ?string $remarks = null): WorkJob
    {
        return $this->transition(
            $workJob,
            WorkJobStatus::NoShow,
            $actor,
            $remarks ?: 'Customer marked as no show.'
        );
    }

    /**
     * Update fabrication independently from payment and installation progress.
     */
    public function updateFabrication(WorkJob $workJob, array $data, User $actor): WorkJob
    {
        $status = FabricationStatus::from($data['status']);
        $wasReady = $workJob->fabrication_status === FabricationStatus::ReadyForInstallation;
        $isReady = $status === FabricationStatus::ReadyForInstallation;
        $isNotRequired = $status === FabricationStatus::NotRequired;
        $startedAt = $workJob->fabrication_started_at;

        if ($status === FabricationStatus::InProgress && ! $startedAt) {
            $startedAt = now();
        }

        $message = $this->fabricationUpdateMessage(
            $status,
            $data['expected_completion_date'] ?? null,
            $data['notes'] ?? null
        );

        DB::transaction(function () use (
            $workJob,
            $status,
            $data,
            $actor,
            $message,
            $startedAt,
            $wasReady,
            $isReady,
            $isNotRequired
        ) {
            $workJob->update([
                'fabrication_status' => $status,
                'fabrication_expected_completion_date' => $isNotRequired
                    ? null
                    : ($data['expected_completion_date'] ?? $workJob->fabrication_expected_completion_date),
                'fabrication_started_at' => $isNotRequired ? null : $startedAt,
                'fabrication_completed_at' => $isNotRequired
                    ? null
                    : ($isReady
                        ? ($workJob->fabrication_completed_at ?? now())
                        : ($wasReady ? null : $workJob->fabrication_completed_at)),
                'fabrication_notes' => $isNotRequired ? null : ($data['notes'] ?? null),
                'fabrication_updated_at' => now(),
            ]);

            $workJob->remarks()->create([
                'user_id' => $actor->id,
                'action' => "fabrication_{$status->value}",
                'message' => $message,
            ]);
        });

        $workJob = $workJob->fresh()->load($this->relations());
        WorkJobChanged::dispatch($workJob, "fabrication_{$status->value}", $message, $actor);
        WorkJobFabricationUpdated::dispatch($workJob, $status, $message, $actor);

        return $workJob;
    }

    private function transition(WorkJob $workJob, WorkJobStatus $next, User $actor, string $message): WorkJob
    {
        $this->ensureCanTransition($workJob, $next);

        DB::transaction(function () use ($workJob, $next, $actor, $message) {
            $workJob->update(['status' => $next]);

            $workJob->remarks()->create([
                'user_id' => $actor->id,
                'action' => $next->value,
                'message' => $message,
            ]);
        });

        $workJob = $workJob->fresh()->load($this->relations());
        WorkJobChanged::dispatch($workJob, $next->value, $message, $actor);
        WorkJobStatusChanged::dispatch($workJob, $next, $message, $actor);

        return $workJob;
    }

    /**
     * Guard status transitions using the WorkJobStatus enum rules.
     */
    private function ensureCanTransition(WorkJob $workJob, WorkJobStatus $next): void
    {
        if (! $workJob->status->canTransitionTo($next)) {
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

    private function ensureWorkersAvailable(
        array $workerIds,
        string $date,
        string $from,
        string $to,
        ?int $excludeAppointmentId = null,
        ?int $excludeWorkJobId = null
    ): void {
        $availableIds = $this->workerService
            ->getAvailable($date, $from, $to, $excludeAppointmentId, $excludeWorkJobId)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $selectedIds = array_map('intval', $workerIds);
        $unavailableIds = array_values(array_diff($selectedIds, $availableIds));

        if ($unavailableIds !== []) {
            throw ValidationException::withMessages([
                'worker_ids' => 'One or more selected workers already have an appointment, work job, or back job during this schedule.',
            ]);
        }
    }

    private function backJobCreatedMessage(WorkJob $backJob, WorkJobBackJobReason $reason, string $details): string
    {
        return "Back job {$backJob->work_job_number} scheduled ({$reason->label()}). {$details}";
    }

    private function defaultFabricationStatus(string $serviceType): FabricationStatus
    {
        return in_array($serviceType, ['installation', 'quotation'], true)
            ? FabricationStatus::Pending
            : FabricationStatus::NotRequired;
    }

    private function fabricationUpdateMessage(
        FabricationStatus $status,
        ?string $expectedCompletionDate,
        ?string $notes
    ): string {
        $message = "Fabrication updated to {$status->label()}.";

        if ($expectedCompletionDate && $status !== FabricationStatus::ReadyForInstallation) {
            $message .= " Expected completion: {$expectedCompletionDate}.";
        }

        if (filled($notes)) {
            $message .= ' '.trim($notes);
        }

        return $message;
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
            'charges.creator',
            'charges.approver',
            'rating.customer',
            'warranty.issuedBy',
            'remarks.user',
        ];
    }
}
