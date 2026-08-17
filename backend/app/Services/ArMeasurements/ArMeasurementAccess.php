<?php

namespace App\Services\ArMeasurements;

use App\Models\Appointment;
use App\Models\ArMeasurementSession;
use App\Models\User;

class ArMeasurementAccess
{
    public function canAccessAppointment(User $user, Appointment $appointment): bool
    {
        if ($user->isOperationsAdmin()) {
            return true;
        }

        if ($user->isCustomer()) {
            return (int) $appointment->user_id === (int) $user->id;
        }

        if ($user->isWorker()) {
            return $appointment->workers()
                ->whereKey($user->id)
                ->exists();
        }

        return false;
    }

    public function canAccessSession(User $user, ArMeasurementSession $session): bool
    {
        if ($user->isOperationsAdmin()) {
            return true;
        }

        if ($user->isCustomer()) {
            return (int) $session->customer_id === (int) $user->id
                && (int) $session->appointment?->user_id === (int) $user->id;
        }

        if ($user->isWorker()) {
            return $session->appointment?->workers()
                ->whereKey($user->id)
                ->exists() ?? false;
        }

        return false;
    }

    public function canReviewSession(User $user, ArMeasurementSession $session): bool
    {
        return ! $user->isCustomer()
            && $this->canAccessSession($user, $session);
    }

    public function abortUnlessAppointmentAccessible(
        User $user,
        Appointment $appointment
    ): void {
        abort_unless(
            $this->canAccessAppointment($user, $appointment),
            $user->isCustomer() ? 404 : 403,
            'This appointment is not available to you.'
        );
    }

    public function abortUnlessSessionAccessible(
        User $user,
        ArMeasurementSession $session
    ): void {
        abort_unless(
            $this->canAccessSession($user, $session),
            $user->isCustomer() ? 404 : 403,
            'This measurement session is not available to you.'
        );
    }

    public function sourceFor(User $user): string
    {
        return match (true) {
            $user->isCustomer() => 'customer',
            $user->isWorker() && ! $user->isOperationsAdmin() => 'worker',
            default => 'staff',
        };
    }
}
