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
            ->where(function (Builder $query) use ($user) {
                $query->where('user_id', $user->id);

                if ($user->email) {
                    $query->orWhereRaw('lower(email) = ?', [strtolower($user->email)]);
                }

                if ($user->phone_number) {
                    $query->orWhereRaw($this->normalizedPhoneSql('phone_number') . ' = ?', [$this->normalizePhone($user->phone_number)]);
                }
            });
    }

    public function workJobsFor(User $user): Builder
    {
        return WorkJob::query()
            ->where(function (Builder $query) use ($user) {
                if ($user->email) {
                    $query->whereRaw('lower(email) = ?', [strtolower($user->email)]);
                }

                if ($user->phone_number) {
                    $method = $user->email ? 'orWhereRaw' : 'whereRaw';
                    $query->{$method}($this->normalizedPhoneSql('phone_number') . ' = ?', [$this->normalizePhone($user->phone_number)]);
                }
            });
    }

    public function canAccessAppointment(User $user, Appointment $appointment): bool
    {
        return (int) $appointment->user_id === (int) $user->id
            || ($user->email && strtolower((string) $appointment->email) === strtolower($user->email))
            || ($user->phone_number && $this->normalizePhone($appointment->phone_number) === $this->normalizePhone($user->phone_number));
    }

    public function canAccessWorkJob(User $user, WorkJob $workJob): bool
    {
        return ($user->email && strtolower((string) $workJob->email) === strtolower($user->email))
            || ($user->phone_number && $this->normalizePhone($workJob->phone_number) === $this->normalizePhone($user->phone_number));
    }

    private function normalizePhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }

        return preg_replace('/[\s().-]+/', '', $phone);
    }

    private function normalizedPhoneSql(string $column): string
    {
        return "replace(replace(replace(replace(replace({$column}, ' ', ''), '-', ''), '(', ''), ')', ''), '.', '')";
    }
}
