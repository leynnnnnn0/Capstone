<?php

use App\Mail\CustomerAuth\CustomerOtpMail;
use App\Models\Appointment;
use App\Models\CustomerLoginOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use OwenIt\Auditing\Models\Audit;

uses(RefreshDatabase::class);

it('audits staff login and logout', function () {
    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'role' => 'admin',
    ]);

    $this->postJson('/api/login', [
        'email' => 'admin@example.com',
        'password' => 'password',
    ])->assertOk();

    $this->assertDatabaseHas('audits', [
        'event' => 'staff_login',
        'auditable_type' => User::class,
        'auditable_id' => $user->id,
        'user_type' => User::class,
        'user_id' => $user->id,
    ]);

    $token = $user->createToken('auth-token')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/logout')
        ->assertOk();

    $this->assertDatabaseHas('audits', [
        'event' => 'staff_logout',
        'auditable_type' => User::class,
        'auditable_id' => $user->id,
        'user_type' => User::class,
        'user_id' => $user->id,
    ]);
});

it('audits customer otp requests and customer login without storing otp hashes in audit values', function () {
    Mail::fake();

    Appointment::factory()->create([
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'email' => 'customer@example.com',
        'phone_number' => '+63 912 345 6789',
    ]);

    $this->postJson('/api/customer/request-otp', [
        'contact' => 'customer@example.com',
    ])->assertOk();

    Mail::assertQueued(CustomerOtpMail::class);

    $otp = CustomerLoginOtp::query()->latest()->first();

    $this->assertDatabaseHas('audits', [
        'event' => 'customer_otp_requested',
        'auditable_type' => CustomerLoginOtp::class,
        'auditable_id' => $otp->id,
    ]);

    $otp->update([
        'code_hash' => bcrypt('123456'),
        'expires_at' => now()->addMinutes(10),
    ]);

    $this->postJson('/api/customer/verify-otp', [
        'contact' => 'customer@example.com',
        'code' => '123456',
    ])->assertOk();

    $customer = User::query()->where('email', 'customer@example.com')->first();

    $this->assertDatabaseHas('audits', [
        'event' => 'customer_login',
        'auditable_type' => User::class,
        'auditable_id' => $customer->id,
        'user_type' => User::class,
        'user_id' => $customer->id,
    ]);

    Audit::query()
        ->where('auditable_type', CustomerLoginOtp::class)
        ->get()
        ->each(function (Audit $audit) {
            expect((array) $audit->new_values)->not->toHaveKey('code_hash');
            expect((array) $audit->old_values)->not->toHaveKey('code_hash');
        });
});
