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
        return User::where('role', 'worker')
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
