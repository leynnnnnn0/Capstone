<?php
// app/Services/WorkJobService.php

namespace App\Services;

use App\Enums\WorkJobStatus;
use App\Exceptions\InvalidStatusTransitionException;
use App\Models\Appointment;
use App\Models\WorkJob;
use Illuminate\Support\Facades\DB;

class WorkJobService
{
    public function create(array $data): WorkJob
    {
        return DB::transaction(function () use ($data) {
            $workerIds = $data['worker_ids'];

            $workJob = WorkJob::create([
                'appointment_id'       => $data['appointment_id'] ?? null,
                'quotation_id'         => $data['quotation_id'] ?? null,
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
            ]);

            $workJob->workers()->sync($workerIds);

            return $workJob->load(['workers', 'appointment', 'quotation']);
        });
    }

    public function createFromAppointment(Appointment $appointment): WorkJob
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
        ]);
    }

    public function markInProgress(WorkJob $workJob): WorkJob
    {
        $this->ensureCanTransition($workJob, WorkJobStatus::InProgress);
        $workJob->update(['status' => WorkJobStatus::InProgress]);
        return $workJob->fresh();
    }

    public function complete(WorkJob $workJob): WorkJob
    {
        $this->ensureCanTransition($workJob, WorkJobStatus::Completed);
        $workJob->update(['status' => WorkJobStatus::Completed]);
        return $workJob->fresh();
    }

    public function cancel(WorkJob $workJob): WorkJob
    {
        $this->ensureCanTransition($workJob, WorkJobStatus::Cancelled);
        $workJob->update(['status' => WorkJobStatus::Cancelled]);
        return $workJob->fresh();
    }

    private function ensureCanTransition(WorkJob $workJob, WorkJobStatus $next): void
    {
        if (!$workJob->status->canTransitionTo($next)) {
            throw new InvalidStatusTransitionException(
                "Cannot move from {$workJob->status->label()} to {$next->label()}."
            );
        }
    }
}
