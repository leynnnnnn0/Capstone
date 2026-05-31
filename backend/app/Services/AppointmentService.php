<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Events\AppointmentBooked;
use App\Events\AppointmentCancelled;
use App\Events\AppointmentConfirmed;
use App\Events\AppointmentRescheduled;
use App\Events\AppointmentStatusChanged;
use App\Events\AppointmentUpdated;
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

    /**
     * Create a customer appointment request.
     *
     * This also creates an initial quotation when the booking form or AR quote
     * flow includes product line items. After the transaction, an event is
     * dispatched so notifications and realtime UI updates stay outside the
     * database write path.
     */
    public function create(array $validated, ?User $actor = null): Appointment
    {
        $this->ensureSlotAvailable(
            $validated['preferred_date'],
            $validated['preferred_time']
        );

        $appointment = DB::transaction(function () use ($validated, $actor) {
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
                ], $actor);
            }

            return $appointment;
        });

        AppointmentBooked::dispatch($appointment, $actor);

        return $appointment;
    }

    /**
     * Update appointment details, workers, and optional quotation items.
     *
     * Status changes create remarks and dispatch status events; normal edits
     * dispatch a simpler "details updated" event.
     */
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
                    ], $actor);
                } else {
                    $this->quotationService->create([
                        'appointment_id' => $appointment->id,
                        'items' => $validated['items'],
                        'notes' => $validated['quotation_notes'] ?? null,
                    ], $actor);
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
                "Appointment status changed to {$updated->status->label()}.",
                $actor
            );
        } else {
            AppointmentUpdated::dispatch(
                $updated,
                'Appointment details updated.',
                $actor
            );
        }

        return $updated;
    }

    /**
     * Prevent overbooking the same preferred date/time slot.
     */
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


    /**
     * Confirm an appointment and assign the workers who will visit the customer.
     */
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


        AppointmentConfirmed::dispatch($appointment->fresh(), $actor);


        return $appointment->fresh();
    }

    /**
     * Cancel an appointment with a required reason for audit/customer visibility.
     */
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

        AppointmentCancelled::dispatch($appointment->fresh(), $actor);

        return $appointment->fresh();
    }

    /**
     * Reopen a cancelled/completed appointment when staff need to continue work.
     */
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
            $data['remarks'] ?? 'Appointment reopened.',
            $actor
        );

        return $appointment->fresh();
    }

    /**
     * Move an appointment to a new confirmed date/time window.
     */
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

        AppointmentRescheduled::dispatch($appointment->fresh(), $actor);

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
            'Worker is on the way.',
            $actor
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
            'Job is now in progress.',
            $actor
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
            'Appointment completed.',
            $actor
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
            $message,
            $actor
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
