<?php

namespace App\Services\Customer;

use App\Models\Appointment;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class CustomerAccountResolver
{
    public function resolveForBooking(array $data, ?User $actor = null): User
    {
        if ($actor?->isCustomer()) {
            $this->assignCustomerRole($actor);

            return $actor;
        }

        if (! empty($data['user_id'])) {
            $user = User::query()->findOrFail($data['user_id']);
            $this->ensureCustomerAccount($user);
            $this->fillMissingCustomerDetails(
                $user,
                $data,
                $this->normalizeEmail($data['email'] ?? null),
                $this->normalizePhone($data['phone_number'] ?? null)
            );

            return $user;
        }

        $email = $this->normalizeEmail($data['email'] ?? null);
        $phone = $this->normalizePhone($data['phone_number'] ?? null);

        if (! $email && ! $phone) {
            throw ValidationException::withMessages([
                'contact' => 'Please provide an email or phone number for this customer.',
            ]);
        }

        $emailUser = $email ? $this->findByEmail($email) : null;
        $phoneUser = $phone ? $this->findByPhone($phone) : null;

        if ($emailUser && $phoneUser && (int) $emailUser->id !== (int) $phoneUser->id) {
            throw ValidationException::withMessages([
                'contact' => 'This email and phone number belong to different customer accounts. Please verify the contact details.',
            ]);
        }

        $user = $emailUser ?: $phoneUser;

        if ($user) {
            $this->ensureCustomerAccount($user);
            $this->fillMissingCustomerDetails($user, $data, $email, $phone);

            return $user;
        }

        return $this->createCustomer($data, $email, $phone);
    }

    public function claimRecordsFor(User $user, string $contact, string $contactType): void
    {
        $this->ensureCustomerAccount($user);

        if ($contactType === 'email') {
            $email = $this->normalizeEmail($contact);

            Appointment::query()
                ->whereNull('user_id')
                ->whereNotNull('email')
                ->whereRaw('lower(email) = ?', [$email])
                ->update(['user_id' => $user->id]);

            WorkJob::query()
                ->whereNull('user_id')
                ->whereNotNull('email')
                ->whereRaw('lower(email) = ?', [$email])
                ->update(['user_id' => $user->id]);

            return;
        }

        $phone = $this->normalizePhone($contact);

        Appointment::query()
            ->whereNull('user_id')
            ->whereNotNull('phone_number')
            ->get()
            ->filter(fn (Appointment $appointment) => $this->normalizePhone($appointment->phone_number) === $phone)
            ->each(fn (Appointment $appointment) => $appointment->update(['user_id' => $user->id]));

        WorkJob::query()
            ->whereNull('user_id')
            ->whereNotNull('phone_number')
            ->get()
            ->filter(fn (WorkJob $workJob) => $this->normalizePhone($workJob->phone_number) === $phone)
            ->each(fn (WorkJob $workJob) => $workJob->update(['user_id' => $user->id]));
    }

    public function normalizeEmail(?string $email): ?string
    {
        $email = $email ? strtolower(trim($email)) : null;

        return $email ?: null;
    }

    public function normalizePhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }

        return preg_replace('/[\s().-]+/', '', $phone);
    }

    private function findByEmail(string $email): ?User
    {
        return User::query()
            ->whereNotNull('email')
            ->whereRaw('lower(email) = ?', [$email])
            ->first();
    }

    private function findByPhone(string $phone): ?User
    {
        return User::query()
            ->whereNotNull('phone_number')
            ->get()
            ->first(fn (User $user) => $this->normalizePhone($user->phone_number) === $phone);
    }

    private function createCustomer(array $data, ?string $email, ?string $phone): User
    {
        $customer = User::create([
            'username' => 'customer_' . Str::lower(Str::random(10)),
            'first_name' => $data['first_name'] ?? 'SOG',
            'last_name' => $data['last_name'] ?? 'Customer',
            'email' => $email,
            'phone_number' => $phone,
            'password' => Str::password(32),
            'role' => 'customer',
            'email_verified_at' => $email ? now() : null,
        ]);

        $this->assignCustomerRole($customer);

        return $customer;
    }

    private function ensureCustomerAccount(User $user): void
    {
        if (! $user->isCustomer()) {
            throw ValidationException::withMessages([
                'contact' => 'Use the staff login for this account.',
            ]);
        }

        $this->assignCustomerRole($user);
    }

    private function fillMissingCustomerDetails(User $user, array $data, ?string $email, ?string $phone): void
    {
        $user->fill([
            'first_name' => $user->first_name ?: ($data['first_name'] ?? null),
            'last_name' => $user->last_name ?: ($data['last_name'] ?? null),
            'email' => $user->email ?: $email,
            'phone_number' => $user->phone_number ?: $phone,
            'email_verified_at' => $user->email_verified_at ?: ($email ? now() : null),
        ])->save();
    }

    private function assignCustomerRole(User $user): void
    {
        Role::findOrCreate('customer', 'web');
        $user->assignRole('customer');
    }
}
