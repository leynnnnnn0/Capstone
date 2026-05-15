<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class WorkerService
{
    public function getAvailable(
        string $date,
        string $from,
        string $to,
        ?int $excludeAppointmentId = null
    ): Collection {
        return User::query()
            ->where(function ($query) {
                $query
                    ->whereIn('role', ['worker', 'admin'])
                    ->orWhereHas('roles', fn ($query) => $query->whereIn('name', ['worker', 'admin']));
            })
            ->whereDoesntHave('appointments', function ($query) use ($date, $from, $to, $excludeAppointmentId) {
                $query->where('appointment_date', $date)
                    ->where('appointment_time_from', '<', $to)
                    ->where('appointment_time_until', '>', $from)
                    ->whereIn('status', [
                        AppointmentStatus::Confirmed->value,
                        AppointmentStatus::OnTheWay->value,
                        AppointmentStatus::InProgress->value,
                    ])
                    ->when(
                        $excludeAppointmentId,
                        fn($q) =>
                        $q->where('appointments.id', '!=', $excludeAppointmentId)
                    );
            })
            ->get(['id', 'first_name', 'last_name']);
    }
}
