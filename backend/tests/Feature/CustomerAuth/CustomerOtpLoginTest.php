<?php

use App\Jobs\SendSmsJob;
use App\Mail\CustomerAuth\CustomerOtpMail;
use App\Models\Appointment;
use App\Models\CustomerLoginOtp;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

it('sends a customer login code by email', function () {
    Mail::fake();
    Appointment::factory()->create([
        'email' => 'customer@example.com',
        'phone_number' => '+63 912 345 6789',
    ]);

    $this->postJson('/api/customer/request-otp', [
        'contact' => 'CUSTOMER@example.com',
    ])
        ->assertOk()
        ->assertJsonPath('data.contact', 'customer@example.com')
        ->assertJsonPath('data.contact_type', 'email');

    Mail::assertQueued(CustomerOtpMail::class, function (CustomerOtpMail $mail) {
        return preg_match('/^\d{6}$/', $mail->code) === 1;
    });

    $this->assertDatabaseHas('customer_login_otps', [
        'contact' => 'customer@example.com',
        'contact_type' => 'email',
        'consumed_at' => null,
    ]);
});

it('sends a customer login code by sms', function () {
    Queue::fake();
    Appointment::factory()->create([
        'email' => 'customer@example.com',
        'phone_number' => '+63 912 345 6789',
    ]);

    $this->postJson('/api/customer/request-otp', [
        'contact' => '+63 912 345 6789',
    ])
        ->assertOk()
        ->assertJsonPath('data.contact', '+639123456789')
        ->assertJsonPath('data.contact_type', 'phone');

    Queue::assertPushed(SendSmsJob::class, function (SendSmsJob $job) {
        return $job->recipient === '+639123456789'
            && str_contains($job->message, 'SOG Glass & Aluminum');
    });
});

it('verifies an otp and creates a customer session', function () {
    $appointment = Appointment::factory()->create([
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'email' => 'customer@example.com',
        'phone_number' => '+63 912 345 6789',
    ]);

    CustomerLoginOtp::create([
        'contact' => 'customer@example.com',
        'contact_type' => 'email',
        'code_hash' => Hash::make('123456'),
        'expires_at' => now()->addMinutes(10),
    ]);

    $response = $this->postJson('/api/customer/verify-otp', [
        'contact' => 'customer@example.com',
        'code' => '123456',
    ])
        ->assertOk()
        ->assertJsonPath('user.role', 'customer')
        ->assertCookie('auth_token')
        ->assertCookie('user_role');

    $this->assertDatabaseHas('users', [
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'email' => 'customer@example.com',
        'phone_number' => '+639123456789',
        'role' => 'customer',
    ]);

    expect($appointment->fresh()->user_id)->toBe($response->json('user.id'));
    expect(CustomerLoginOtp::first()->consumed_at)->not->toBeNull();
});

it('rejects an invalid otp without logging in', function () {
    CustomerLoginOtp::create([
        'contact' => 'customer@example.com',
        'contact_type' => 'email',
        'code_hash' => Hash::make('123456'),
        'expires_at' => now()->addMinutes(10),
    ]);

    $this->postJson('/api/customer/verify-otp', [
        'contact' => 'customer@example.com',
        'code' => '000000',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['code'])
        ->assertCookieMissing('auth_token');

    expect(CustomerLoginOtp::first()->attempts)->toBe(1);
});

it('reuses an existing customer account when verifying', function () {
    $appointment = Appointment::factory()->create([
        'email' => 'customer@example.com',
        'phone_number' => '+63 912 345 6789',
    ]);

    $user = User::factory()->create([
        'email' => 'customer@example.com',
        'role' => 'customer',
    ]);

    CustomerLoginOtp::create([
        'contact' => 'customer@example.com',
        'contact_type' => 'email',
        'code_hash' => Hash::make('123456'),
        'expires_at' => now()->addMinutes(10),
    ]);

    $this->postJson('/api/customer/verify-otp', [
        'contact' => 'customer@example.com',
        'code' => '123456',
    ])
        ->assertOk()
        ->assertJsonPath('user.id', $user->id);

    expect(User::where('email', 'customer@example.com')->count())->toBe(1);
    expect($appointment->fresh()->user_id)->toBe($user->id);
});

it('does not allow staff accounts to log in through customer otp', function () {
    Appointment::factory()->create([
        'email' => 'admin@example.com',
    ]);

    User::factory()->create([
        'email' => 'admin@example.com',
        'role' => 'admin',
    ]);

    CustomerLoginOtp::create([
        'contact' => 'admin@example.com',
        'contact_type' => 'email',
        'code_hash' => Hash::make('123456'),
        'expires_at' => now()->addMinutes(10),
    ]);

    $this->postJson('/api/customer/verify-otp', [
        'contact' => 'admin@example.com',
        'code' => '123456',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['contact'])
        ->assertCookieMissing('auth_token');
});

it('does not send otp when contact has no appointment or work job', function () {
    Mail::fake();

    $this->postJson('/api/customer/request-otp', [
        'contact' => 'unknown@example.com',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['contact']);

    Mail::assertNothingQueued();
});

it('resolves email and phone logins to the same customer account from appointment identity', function () {
    $appointment = Appointment::factory()->create([
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'email' => 'maria@example.com',
        'phone_number' => '+63 917 111 2222',
    ]);

    CustomerLoginOtp::create([
        'contact' => 'maria@example.com',
        'contact_type' => 'email',
        'code_hash' => Hash::make('111111'),
        'expires_at' => now()->addMinutes(10),
    ]);

    $emailLogin = $this->postJson('/api/customer/verify-otp', [
        'contact' => 'maria@example.com',
        'code' => '111111',
    ])->assertOk();

    CustomerLoginOtp::create([
        'contact' => '+639171112222',
        'contact_type' => 'phone',
        'code_hash' => Hash::make('222222'),
        'expires_at' => now()->addMinutes(10),
    ]);

    $phoneLogin = $this->postJson('/api/customer/verify-otp', [
        'contact' => '+63 917 111 2222',
        'code' => '222222',
    ])->assertOk();

    expect($phoneLogin->json('user.id'))->toBe($emailLogin->json('user.id'));
    expect(User::where('email', 'maria@example.com')->count())->toBe(1);
    expect($appointment->fresh()->user_id)->toBe($emailLogin->json('user.id'));
});

it('can use a work job contact when no appointment exists', function () {
    Queue::fake();

    $workJob = WorkJob::factory()->create([
        'email' => 'worker-customer@example.com',
        'phone_number' => '+63 918 222 3333',
    ]);

    $this->postJson('/api/customer/request-otp', [
        'contact' => '+63 918 222 3333',
    ])
        ->assertOk()
        ->assertJsonPath('data.contact', '+639182223333');

    Queue::assertPushed(SendSmsJob::class);

    CustomerLoginOtp::query()
        ->where('contact', '+639182223333')
        ->where('contact_type', 'phone')
        ->latest()
        ->first()
        ->update([
            'code_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(10),
        ]);

    $response = $this->postJson('/api/customer/verify-otp', [
        'contact' => '+63 918 222 3333',
        'code' => '123456',
    ])->assertOk();

    expect($workJob->fresh()->user_id)->toBe($response->json('user.id'));
});
