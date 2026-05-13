<?php

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin   = User::factory()->create(['role' => 'admin']);
    $this->workers = User::factory(2)->create(['role' => 'worker']);
});

$validPayload = fn() => [
    'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
    'appointment_time_from'  => '09:00',
    'appointment_time_until' => '10:00',
];

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

it('returns 422 when appointment cannot be confirmed', function () use ($validPayload, $appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
    ]);

    $response = $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/confirm", [
            ...$validPayload(),
            'appointment_date' => '2026-04-04',
            'worker_ids' => $this->workers->pluck('id')->toArray(),
        ]);


    $response->assertStatus(422);
});

it('creates a remark when confirming an appointment', function () use ($validPayload, $appointmentPayload) {
    $appointment = Appointment::factory()->create($appointmentPayload());

    $response = $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/confirm", [
            ...$validPayload(),
            'worker_ids' => $this->workers->pluck('id')->toArray(), 
            'remarks'    => 'Customer requested for a specific time slot.',
        ]);

    $response->assertStatus(200);

    expect($appointment->fresh()->remarks)->toHaveCount(1);
});

it('assigns workers when confirming an appointment', function () use ($validPayload, $appointmentPayload) {
    $this->withoutExceptionHandling();
    $appointment = Appointment::factory()->create($appointmentPayload());

    $response = $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/confirm", [
            ...$validPayload(),
            'worker_ids' => $this->workers->pluck('id')->toArray(),
        ]);

    $response->assertStatus(200);

    expect($appointment->fresh()->workers)->toHaveCount(2);
});
