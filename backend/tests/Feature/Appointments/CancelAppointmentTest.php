<?php


use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

$appointmentPayload = fn() => [
    'first_name'     => 'Juan',
    'last_name'      => 'dela Cruz',
    'phone_number'   => '+63 912 345 6789',
    'address'        => '123 Rizal Street, Bacoor, Cavite',
    'preferred_date' => now()->addDays(3)->format('Y-m-d'),
    'preferred_time' => 'morning',
    'service_type'   => 'repair',
    'consent'        => true,
];

it('cancels a pending appointment', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create($appointmentPayload());

    $response = $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/cancel", [
            'reason' => 'Customer requested cancellation.',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'cancelled');

    expect($appointment->fresh()->status)->toBe(AppointmentStatus::Cancelled);
});

it('cancels a confirmed appointment', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status' => AppointmentStatus::Confirmed,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/cancel", [
            'reason' => 'Admin cancelled.',
        ])
        ->assertStatus(200);
});

it('creates a remark when cancelling', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create($appointmentPayload());

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/cancel", [
            'reason' => 'Customer requested cancellation.',
        ]);

    expect($appointment->fresh()->remarks)->toHaveCount(1);
});

it('cannot cancel a completed appointment', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status' => AppointmentStatus::Completed,
    ]);

    $response = $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/cancel", [
            'reason' => 'Too late.',
        ]);


    $response->assertStatus(422);
});

it('requires a reason to cancel', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create($appointmentPayload());

    $response = $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/cancel", []);


     $response->assertStatus(422)
        ->assertJsonValidationErrors(['reason']);
});

