<?php

use App\Models\Appointment;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('backfills legacy appointments into customer accounts', function () {
    $first = Appointment::factory()->create([
        'user_id' => null,
        'first_name' => 'Nathaniel',
        'last_name' => 'Alvarez',
        'email' => 'TEST@example.com',
        'phone_number' => '+63 911 111 1111',
    ]);

    $second = Appointment::factory()->create([
        'user_id' => null,
        'first_name' => 'Nathaniel',
        'last_name' => 'Alvarez',
        'email' => 'test@example.com',
        'phone_number' => '+63 922 222 2222',
    ]);

    $this->artisan('customers:backfill-record-owners')
        ->expectsOutput('Customer record ownership backfill complete.')
        ->assertExitCode(0);

    $first->refresh();
    $second->refresh();

    expect($first->user_id)->not->toBeNull()
        ->and($second->user_id)->toBe($first->user_id)
        ->and(User::query()->whereRaw('lower(email) = ?', ['test@example.com'])->count())->toBe(1);
});

it('backfills legacy work jobs from their linked appointment owner', function () {
    $appointment = Appointment::factory()->create([
        'user_id' => null,
        'email' => 'legacy@example.com',
        'phone_number' => '+63 933 333 3333',
    ]);

    $workJob = WorkJob::factory()->create([
        'user_id' => null,
        'appointment_id' => $appointment->id,
        'email' => 'legacy@example.com',
        'phone_number' => '+63 933 333 3333',
    ]);

    $this->artisan('customers:backfill-record-owners')
        ->assertExitCode(0);

    $appointment->refresh();
    $workJob->refresh();

    expect($appointment->user_id)->not->toBeNull()
        ->and($workJob->user_id)->toBe($appointment->user_id);
});

it('skips legacy records with conflicting email and phone owners', function () {
    User::factory()->create([
        'role' => 'customer',
        'email' => 'legacy@example.com',
        'phone_number' => '+639111111111',
    ]);

    User::factory()->create([
        'role' => 'customer',
        'email' => 'other@example.com',
        'phone_number' => '+639222222222',
    ]);

    $appointment = Appointment::factory()->create([
        'user_id' => null,
        'email' => 'legacy@example.com',
        'phone_number' => '+639222222222',
    ]);

    $this->artisan('customers:backfill-record-owners')
        ->expectsOutput('Customer record ownership backfill complete.')
        ->assertExitCode(0);

    expect($appointment->refresh()->user_id)->toBeNull();
});
