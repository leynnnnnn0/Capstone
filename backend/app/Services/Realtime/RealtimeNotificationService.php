<?php

namespace App\Services\Realtime;

use App\Events\RecordsChanged;
use App\Events\SystemNotificationCreated;
use App\Models\Appointment;
use App\Models\Quotation;
use App\Models\User;
use App\Models\WorkJob;
use App\Notifications\SystemNotification;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;

class RealtimeNotificationService
{
    public function appointmentChanged(
        Appointment $appointment,
        string $action,
        string $message,
        ?User $actor = null
    ): void
    {
        $appointment->loadMissing(['workers', 'quotation', 'remarks.user']);

        $payload = [
            'type' => 'appointment',
            'action' => $action,
            'title' => "Appointment {$appointment->status->label()}",
            'message' => $message,
            'record_id' => $appointment->id,
            'record_number' => $appointment->appointment_number,
            'href' => "/dashboard/appointments/{$appointment->id}",
        ];

        $staff = $this->staffUsers('appointments.view');
        $customer = $this->customerUser($appointment);

        if ($this->shouldNotifyStaff($actor)) {
            $this->notify($this->withoutActor($staff, $actor), $payload);
        }

        if ($customer && $this->shouldNotifyCustomer($actor)) {
            $this->notify(collect([$customer]), [
                ...$payload,
                'href' => "/account/appointments/{$appointment->id}",
            ]);
        }

        $this->broadcastChange($this->channels($staff, $customer), [
            'type' => 'appointment',
            'action' => $action,
            'id' => $appointment->id,
            'number' => $appointment->appointment_number,
        ]);
    }

    public function workJobChanged(
        WorkJob $workJob,
        string $action,
        string $message,
        ?User $actor = null
    ): void
    {
        $workJob->loadMissing(['workers', 'appointment']);

        $payload = [
            'type' => 'work_job',
            'action' => $action,
            'title' => "Work job {$workJob->status->label()}",
            'message' => $message,
            'record_id' => $workJob->id,
            'record_number' => $workJob->work_job_number,
            'href' => "/dashboard/work-jobs/{$workJob->id}",
        ];

        $staff = $this->staffUsers('work-jobs.view');
        $customer = $this->customerUser($workJob->appointment);

        if ($this->shouldNotifyStaff($actor)) {
            $this->notify($this->withoutActor($staff, $actor), $payload);
        }

        if ($customer && $this->shouldNotifyCustomer($actor)) {
            $this->notify(collect([$customer]), [
                ...$payload,
                'href' => "/account/work-jobs/{$workJob->id}",
            ]);
        }

        $this->broadcastChange($this->channels($staff, $customer), [
            'type' => 'work_job',
            'action' => $action,
            'id' => $workJob->id,
            'number' => $workJob->work_job_number,
        ]);
    }

    public function quotationChanged(
        Quotation $quotation,
        string $action,
        string $message,
        ?User $actor = null
    ): void
    {
        $quotation->loadMissing(['appointment']);
        $appointment = $quotation->appointment;

        $payload = [
            'type' => 'quotation',
            'action' => $action,
            'title' => 'Quotation updated',
            'message' => $message,
            'record_id' => $quotation->id,
            'record_number' => $appointment?->appointment_number,
            'href' => $appointment ? "/dashboard/appointments/{$appointment->id}" : '/dashboard/appointments',
        ];

        $staff = $this->staffUsers('quotations.view');
        $customer = $this->customerUser($appointment);

        if ($this->shouldNotifyStaff($actor)) {
            $this->notify($this->withoutActor($staff, $actor), $payload);
        }

        if ($customer && $appointment && $this->shouldNotifyCustomer($actor)) {
            $this->notify(collect([$customer]), [
                ...$payload,
                'href' => "/account/appointments/{$appointment->id}",
            ]);
        }

        $this->broadcastChange($this->channels($staff, $customer), [
            'type' => 'quotation',
            'action' => $action,
            'id' => $quotation->id,
            'appointment_id' => $appointment?->id,
        ]);
    }

    private function notify(Collection $users, array $payload): void
    {
        $users
            ->unique('id')
            ->values()
            ->each(function (User $user) use ($payload) {
                $user->notify(new SystemNotification($payload));

                $notification = $user->notifications()->latest()->first();

                if ($notification && ! app()->environment('testing')) {
                    SystemNotificationCreated::dispatch(
                        $user->id,
                        $notification,
                        $user->unreadNotifications()->count()
                    );
                }
            });
    }

    private function staffUsers(?string $permission = null): Collection
    {
        return User::query()->whereHas('roles', fn ($query) => $query->whereIn('name', [
            'admin',
            'sub_admin',
            'worker',
        ]))->get();
    }

    private function shouldNotifyStaff(?User $actor): bool
    {
        return $actor === null || $actor->isCustomer();
    }

    private function shouldNotifyCustomer(?User $actor): bool
    {
        return $actor === null || ! $actor->isCustomer();
    }

    private function withoutActor(Collection $users, ?User $actor): Collection
    {
        if (! $actor) {
            return $users;
        }

        return $users->reject(fn (User $user) => $user->id === $actor->id)->values();
    }

    private function customerUser(?Appointment $appointment): ?User
    {
        if (! $appointment) {
            return null;
        }

        if ($appointment->user_id) {
            return User::find($appointment->user_id);
        }

        if (! $appointment->email && ! $appointment->phone_number) {
            return null;
        }

        return User::query()
            ->where(function ($query) use ($appointment) {
                if ($appointment->email) {
                    $query->whereRaw('lower(email) = ?', [strtolower($appointment->email)]);
                }

                if ($appointment->phone_number) {
                    $method = $appointment->email ? 'orWhereRaw' : 'whereRaw';
                    $query->{$method}(
                        $this->normalizedPhoneSql('phone_number') . ' = ?',
                        [$this->normalizePhone($appointment->phone_number)]
                    );
                }
            })
            ->where(function ($query) {
                $query->where('role', 'customer')
                    ->orWhereHas('roles', fn ($roleQuery) => $roleQuery->where('name', 'customer'));
            })
            ->first();
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

    private function channels(Collection $users, ?User $customer = null): array
    {
        $channels = collect($users->map(fn (User $user) => "users.{$user->id}")->all());

        if ($customer) {
            $channels->push("users.{$customer->id}");
        }

        $channels->push('staff');

        return $channels->unique()->values()->all();
    }

    private function broadcastChange(array $channels, array $payload): void
    {
        if (app()->environment('testing')) {
            return;
        }

        RecordsChanged::dispatch($channels, [
            ...$payload,
            'occurred_at' => now()->toISOString(),
        ]);
    }
}
