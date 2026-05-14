<?php

namespace App\Services\CustomerAuth;

use App\Jobs\SendSmsJob;
use App\Mail\CustomerAuth\CustomerOtpMail;
use App\Models\Appointment;
use App\Models\CustomerLoginOtp;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CustomerOtpService
{
    private const EXPIRY_MINUTES = 10;
    private const COOLDOWN_SECONDS = 60;
    private const MAX_ATTEMPTS = 5;

    public function requestCode(string $contact, Request $request): array
    {
        $contactType = $this->contactType($contact);
        $this->ensureCustomerContact($contact, $contactType);
        $this->ensureRequestCooldown($contact, $contactType);

        $code = (string) random_int(100000, 999999);

        CustomerLoginOtp::query()
            ->where('contact', $contact)
            ->where('contact_type', $contactType)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        CustomerLoginOtp::create([
            'contact' => $contact,
            'contact_type' => $contactType,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(self::EXPIRY_MINUTES),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1000),
        ]);

        $this->sendCode($contact, $contactType, $code);

        return [
            'contact' => $contact,
            'contact_type' => $contactType,
            'expires_in' => self::EXPIRY_MINUTES * 60,
        ];
    }

    public function verifyCode(string $contact, string $code): User
    {
        $contactType = $this->contactType($contact);

        $otp = CustomerLoginOtp::query()
            ->where('contact', $contact)
            ->where('contact_type', $contactType)
            ->whereNull('consumed_at')
            ->latest()
            ->first();

        if (! $otp || ! $otp->isUsable()) {
            throw ValidationException::withMessages([
                'code' => 'This code is invalid or has expired.',
            ]);
        }

        if ($otp->attempts >= self::MAX_ATTEMPTS) {
            $otp->update(['consumed_at' => now()]);

            throw ValidationException::withMessages([
                'code' => 'Too many attempts. Please request a new code.',
            ]);
        }

        if (! Hash::check($code, $otp->code_hash)) {
            $otp->increment('attempts');

            throw ValidationException::withMessages([
                'code' => 'The code you entered is incorrect.',
            ]);
        }

        $otp->update(['consumed_at' => now()]);

        return $this->findOrCreateCustomer($contact, $contactType);
    }

    private function sendCode(string $contact, string $contactType, string $code): void
    {
        $message = "Your SOG Glass & Aluminum login code is {$code}. It expires in 10 minutes.";

        if ($contactType === 'email') {
            Mail::to($contact)->queue(new CustomerOtpMail($code));
            return;
        }

        SendSmsJob::dispatch($contact, $message);
    }

    private function findOrCreateCustomer(string $contact, string $contactType): User
    {
        $identity = $this->findCustomerIdentity($contact, $contactType);

        if (! $identity) {
            throw ValidationException::withMessages([
                'contact' => 'We could not find an appointment or work job for this contact.',
            ]);
        }

        $user = $this->findUserByIdentity($identity);

        if ($user) {
            if (! $user->isCustomer()) {
                throw ValidationException::withMessages([
                    'contact' => 'Use the staff login for this account.',
                ]);
            }

            $user->fill([
                'first_name' => $user->first_name ?: $identity['first_name'],
                'last_name' => $user->last_name ?: $identity['last_name'],
                'email' => $user->email ?: $identity['email'],
                'phone_number' => $user->phone_number ?: $identity['phone_number'],
                'email_verified_at' => $user->email_verified_at ?: ($identity['email'] ? now() : null),
            ])->save();

            return $user;
        }

        return User::create([
            'username' => 'customer_' . Str::lower(Str::random(10)),
            'first_name' => $identity['first_name'] ?: 'SOG',
            'last_name' => $identity['last_name'] ?: 'Customer',
            'email' => $identity['email'],
            'phone_number' => $identity['phone_number'],
            'password' => Str::password(32),
            'role' => 'customer',
            'email_verified_at' => $identity['email'] ? now() : null,
        ]);
    }

    private function ensureCustomerContact(string $contact, string $contactType): void
    {
        $identity = $this->findCustomerIdentity($contact, $contactType);

        if (! $identity) {
            throw ValidationException::withMessages([
                'contact' => 'We could not find an appointment or work job for this contact.',
            ]);
        }

        $user = $this->findUserByIdentity($identity);

        if ($user && ! $user->isCustomer()) {
            throw ValidationException::withMessages([
                'contact' => 'Use the staff login for this account.',
            ]);
        }
    }

    private function findCustomerIdentity(string $contact, string $contactType): ?array
    {
        $record = $this->findMatchingRecord(Appointment::query()->latest(), $contact, $contactType)
            ?? $this->findMatchingRecord(WorkJob::query()->latest(), $contact, $contactType);

        if (! $record) {
            return null;
        }

        return [
            'first_name' => $record->first_name,
            'last_name' => $record->last_name,
            'email' => $record->email ? strtolower($record->email) : null,
            'phone_number' => $record->phone_number ? $this->normalizePhone($record->phone_number) : null,
        ];
    }

    private function findMatchingRecord($query, string $contact, string $contactType): ?object
    {
        if ($contactType === 'email') {
            return $query
                ->whereNotNull('email')
                ->whereRaw('lower(email) = ?', [$contact])
                ->first();
        }

        return $query
            ->whereNotNull('phone_number')
            ->get()
            ->first(fn ($record) => $this->normalizePhone($record->phone_number) === $contact);
    }

    private function findUserByIdentity(array $identity): ?User
    {
        if ($identity['email']) {
            $user = User::query()->where('email', $identity['email'])->first();

            if ($user) {
                return $user;
            }
        }

        if (! $identity['phone_number']) {
            return null;
        }

        return User::query()
            ->whereNotNull('phone_number')
            ->get()
            ->first(fn (User $user) => $this->normalizePhone($user->phone_number) === $identity['phone_number']);
    }

    private function ensureRequestCooldown(string $contact, string $contactType): void
    {
        $latest = CustomerLoginOtp::query()
            ->where('contact', $contact)
            ->where('contact_type', $contactType)
            ->latest()
            ->first();

        if ($latest && $latest->created_at->gt(now()->subSeconds(self::COOLDOWN_SECONDS))) {
            throw ValidationException::withMessages([
                'contact' => 'Please wait before requesting another code.',
            ]);
        }
    }

    private function contactType(string $contact): string
    {
        return filter_var($contact, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';
    }

    private function normalizePhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }

        return preg_replace('/[\s().-]+/', '', $phone);
    }
}
