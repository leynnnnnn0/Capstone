<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Events\AppointmentBooked;
use App\Events\AppointmentCancelled;
use App\Events\AppointmentConfirmed;
use App\Events\AppointmentRescheduled;
use App\Events\AppointmentStatusChanged;
use App\Exceptions\InvalidStatusTransitionException;
use App\Exceptions\SlotFullException;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class AppointmentService
{
    private const SLOT_CAPACITY = 10;
    public function __construct(
        private readonly QuotationService $quotationService
    ) {}

    public function create(array $validated): Appointment
    {
        $this->ensureSlotAvailable(
            $validated['preferred_date'],
            $validated['preferred_time']
        );

        $appointment = DB::transaction(function () use ($validated) {
            $status = AppointmentStatus::tryFrom($validated['status'] ?? AppointmentStatus::Pending->value) ?? AppointmentStatus::Pending;

            $appointment = Appointment::create([
                ...Arr::except($validated, ['items', 'worker_ids', 'quotation_notes']),
                'status'           => $status,
                'consent_given_at' => $validated['consent'] ? now() : null,
            ]);

            if ($status === AppointmentStatus::Confirmed && !empty($validated['worker_ids'])) {
                $appointment->workers()->sync($validated['worker_ids']);
            }

            // Auto-create quotation if customer included items
            if (!empty($validated['items'])) {
                $this->quotationService->create([
                    'appointment_id' => $appointment->id,
                    'items'          => $validated['items'],
                    'notes'          => $validated['quotation_notes'] ?? null,
                ]);
            }

            return $appointment;
        });

        AppointmentBooked::dispatch($appointment);

        return $appointment;
    }

    public function update(Appointment $appointment, array $validated, User $actor): Appointment
    {
        $originalStatus = $appointment->status;

        $updated = DB::transaction(function () use ($appointment, $validated, $actor, $originalStatus) {
            $appointment->update([
                ...Arr::except($validated, ['items', 'worker_ids', 'quotation_notes']),
            ]);

            if (array_key_exists('worker_ids', $validated)) {
                $appointment->workers()->sync($validated['worker_ids'] ?? []);
            }

            if (!empty($validated['items'])) {
                if ($appointment->quotation) {
                    $this->quotationService->update($appointment->quotation, [
                        'items' => $validated['items'],
                        'notes' => $validated['quotation_notes'] ?? null,
                    ]);
                } else {
                    $this->quotationService->create([
                        'appointment_id' => $appointment->id,
                        'items' => $validated['items'],
                        'notes' => $validated['quotation_notes'] ?? null,
                    ]);
                }
            }

            if ($appointment->fresh()->status !== $originalStatus) {
                $appointment->remarks()->create([
                    'user_id' => $actor->id,
                    'action' => $appointment->fresh()->status->value,
                    'message' => "Appointment status changed to {$appointment->fresh()->status->label()}.",
                ]);
            }

            return $appointment->fresh();
        });

        if ($updated->status !== $originalStatus) {
            AppointmentStatusChanged::dispatch(
                $updated,
                $updated->status,
                "Appointment status changed to {$updated->status->label()}."
            );
        }

        return $updated;
    }

    private function ensureSlotAvailable(string $date, string $time): void
    {
        $count = Appointment::where('preferred_date', $date)
            ->where('preferred_time', $time)
            ->whereIn('status', [
                AppointmentStatus::Pending, 
                AppointmentStatus::Confirmed
                ])
            ->count();

        if ($count >= self::SLOT_CAPACITY) {
            throw new SlotFullException(
                "The {$time} slot on {$date} is fully booked."
            );
        }
    }


    public function confirm(Appointment $appointment, array $data, User $actor): Appointment
    {

        $this->ensureCanTransition($appointment, AppointmentStatus::Confirmed);

        DB::transaction(function () use ($appointment, $data, $actor) {

            $appointment->update([
                'status'                 => AppointmentStatus::Confirmed,
                'appointment_date'       => $data['appointment_date'],
                'appointment_time_from'  => $data['appointment_time_from'],
                'appointment_time_until' => $data['appointment_time_until'],
            ]);

            $appointment->remarks()->create([
                'user_id' => $actor->id,
                'action'  => AppointmentStatus::Confirmed->value,
                'message' => $data['remarks'] ?? 'Appointment confirmed.',
            ]);
            
            $appointment->workers()->sync($data['worker_ids']);
        });


        AppointmentConfirmed::dispatch($appointment->fresh());


        return $appointment->fresh();
    }

    public function cancel(Appointment $appointment, array $data, User $actor): Appointment
    {
        $this->ensureCanTransition($appointment, AppointmentStatus::Cancelled);

        DB::transaction(function () use ($appointment, $data, $actor) {
            $appointment->update(['status' => AppointmentStatus::Cancelled]);

            $appointment->remarks()->create([
                'user_id' => $actor->id,
                'action'  => AppointmentStatus::Cancelled->value,
                'message' => $data['reason'],
            ]);
        });

        AppointmentCancelled::dispatch($appointment->fresh());

        return $appointment->fresh();
    }

    public function reopen(Appointment $appointment, array $data, User $actor): Appointment
    {
        $this->ensureCanTransition($appointment, AppointmentStatus::Reopened);

        DB::transaction(function () use ($appointment, $data, $actor) {
            $message = $data['remarks'] ?? 'Appointment reopened.';

            $appointment->update(['status' => AppointmentStatus::Reopened]);

            $appointment->remarks()->create([
                'user_id' => $actor->id,
                'action'  => AppointmentStatus::Reopened->value,
                'message' => $message,
            ]);
        });

        AppointmentStatusChanged::dispatch(
            $appointment->fresh(),
            AppointmentStatus::Reopened,
            $data['remarks'] ?? 'Appointment reopened.'
        );

        return $appointment->fresh();
    }

    public function reschedule(Appointment $appointment, array $data, User $actor): Appointment
    {
        $this->ensureCanTransition($appointment, AppointmentStatus::Rescheduled);

        DB::transaction(function () use ($appointment, $data, $actor) {
            $appointment->update([
                'status'                 => AppointmentStatus::Rescheduled,
                'appointment_date'       => $data['appointment_date'],
                'appointment_time_from'  => $data['appointment_time_from'],
                'appointment_time_until' => $data['appointment_time_until'],
            ]);

            if (isset($data['worker_ids'])) {
                $appointment->workers()->sync($data['worker_ids']);
            }

            $appointment->remarks()->create([
                'user_id' => $actor->id,
                'action'  => AppointmentStatus::Rescheduled->value,
                'message' => $data['reason'],
            ]);
        });

        AppointmentRescheduled::dispatch($appointment->fresh());

        return $appointment->fresh();
    }

    public function markOnTheWay(Appointment $appointment, User $actor): Appointment
    {
        $this->ensureCanTransition($appointment, AppointmentStatus::OnTheWay);

        DB::transaction(function () use ($appointment, $actor) {
            $appointment->update(['status' => AppointmentStatus::OnTheWay]);

            $appointment->remarks()->create([
                'user_id' => $actor->id,
                'action'  => AppointmentStatus::OnTheWay->value,
                'message' => 'Worker is on the way.',
            ]);
        });

        AppointmentStatusChanged::dispatch(
            $appointment->fresh(),
            AppointmentStatus::OnTheWay,
            'Worker is on the way.'
        );

        return $appointment->fresh();
    }

    public function markInProgress(Appointment $appointment, User $actor): Appointment
    {
        $this->ensureCanTransition($appointment, AppointmentStatus::InProgress);

        DB::transaction(function () use ($appointment, $actor) {
            $appointment->update(['status' => AppointmentStatus::InProgress]);

            $appointment->remarks()->create([
                'user_id' => $actor->id,
                'action'  => AppointmentStatus::InProgress->value,
                'message' => 'Job is now in progress.',
            ]);
        });

        AppointmentStatusChanged::dispatch(
            $appointment->fresh(),
            AppointmentStatus::InProgress,
            'Job is now in progress.'
        );

        return $appointment->fresh();
    }

    public function markCompleted(Appointment $appointment, User $actor): Appointment
    {
        $this->ensureCanTransition($appointment, AppointmentStatus::Completed);

        DB::transaction(function () use ($appointment, $actor) {
            $appointment->update(['status' => AppointmentStatus::Completed]);

            $appointment->remarks()->create([
                'user_id' => $actor->id,
                'action'  => AppointmentStatus::Completed->value,
                'message' => 'Appointment completed.',
            ]);
        });

        AppointmentStatusChanged::dispatch(
            $appointment->fresh(),
            AppointmentStatus::Completed,
            'Appointment completed.'
        );

        return $appointment->fresh();
    }

    public function markNoShow(Appointment $appointment, array $data, User $actor): Appointment
    {
        $this->ensureCanTransition($appointment, AppointmentStatus::NoShow);

        $message = $data['remarks'] ?? 'Customer marked as no show.';

        DB::transaction(function () use ($appointment, $actor, $message) {
            $appointment->update(['status' => AppointmentStatus::NoShow]);

            $appointment->remarks()->create([
                'user_id' => $actor->id,
                'action'  => AppointmentStatus::NoShow->value,
                'message' => $message,
            ]);
        });

        AppointmentStatusChanged::dispatch(
            $appointment->fresh(),
            AppointmentStatus::NoShow,
            $message
        );

        return $appointment->fresh();
    }
    

    private function ensureCanTransition(
        Appointment $appointment,
        AppointmentStatus $next
    ): void {
        if (!$appointment->status->canTransitionTo($next)) {
            throw new InvalidStatusTransitionException(
                "Cannot move from {$appointment->status->label()} to {$next->label()}."
            );
        }
    }
}
