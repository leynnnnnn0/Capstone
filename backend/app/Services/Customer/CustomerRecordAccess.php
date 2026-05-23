<?php

namespace App\Services\Customer;

use App\Models\Appointment;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Database\Eloquent\Builder;

class CustomerRecordAccess
{
    public function appointmentsFor(User $user): Builder
    {
        return Appointment::query()
            ->where('user_id', $user->id);
    }

    public function workJobsFor(User $user): Builder
    {
        return WorkJob::query()
            ->where(function (Builder $query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhereHas('appointment', fn (Builder $query) => $query->where('user_id', $user->id));
            });
    }

    public function canAccessAppointment(User $user, Appointment $appointment): bool
    {
        return (int) $appointment->user_id === (int) $user->id;
    }

    public function canAccessWorkJob(User $user, WorkJob $workJob): bool
    {
        return (int) $workJob->user_id === (int) $user->id
            || (int) $workJob->appointment?->user_id === (int) $user->id;
    }
}
