<?php

use App\Models\Appointment;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

$validPayload = fn() => [
    'first_name'     => 'Juan',
    'last_name'      => 'dela Cruz',
    'phone_number'   => '+63 912 345 6789',
    'address'        => '123 Rizal Street, Bacoor, Cavite',
    'preferred_date' => now()->addDays(3)->format('Y-m-d'),
    'preferred_time' => 'morning',
    'service_type'   => 'repair',
    'consent'        => true,
];


it('creates appointment successfully', function () use ($validPayload) {
    $this->postJson('/api/v1/appointments', $validPayload())
        ->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'appointment_number', 'status'],
        ])
        ->assertJsonPath('data.status', 'pending');

    $this->assertDatabaseHas('appointments', [
        'first_name' => 'Juan',
        'last_name'  => 'dela Cruz',
        'status'     => 'pending',
    ]);
});

it('appointment number follows expected format', function () use ($validPayload) {
    $response = $this->postJson('/api/v1/appointments', $validPayload());

    expect($response->json('data.appointment_number'))
        ->toMatch('/^APT-\d{6}-\d{8}$/');
});

it('stamps consent_given_at server side', function () use ($validPayload) {
    $this->postJson('/api/v1/appointments', $validPayload());

    expect(Appointment::first()->consent_given_at)->not->toBeNull();
});

// ── Business Logic ────────────────────────────────────────────────

it('cannot book appointment in the past', function () use ($validPayload) {
    $this->postJson('/api/v1/appointments', [
        ...$validPayload(),
        'preferred_date' => '2020-01-01',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['preferred_date']);
});

it('requires description when service type is other', function () use ($validPayload) {
    $this->postJson('/api/v1/appointments', [
        ...$validPayload(),
        'service_type'       => 'other',
        'service_type_other' => null,
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['service_type_other']);
});

it('requires consent to be accepted', function () use ($validPayload) {
    $this->postJson('/api/v1/appointments', [
        ...$validPayload(),
        'consent' => false,
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['consent']);
});

it('appointment time until must be after time from', function () use ($validPayload) {
    $this->postJson('/api/v1/appointments', [
        ...$validPayload(),
        'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
        'appointment_time_from'  => '14:00',
        'appointment_time_until' => '10:00',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['appointment_time_until']);
});


it('still allows booking afternoon when morning is full', function () use($validPayload) {
    Appointment::factory(10)->create([
        ...$validPayload(),
        'preferred_date' => '2026-06-01',
        'preferred_time' => 'morning',
    ]);

    $response = $this->postJson('/api/v1/appointments', [
        ...$validPayload(),
        'preferred_date' => '2026-06-01',
        'preferred_time' => 'afternoon',
    ]);

    $response->assertStatus(201);
});

// ── Failure Handling ──────────────────────────────────────────────

it('returns 422 when required fields are missing', function () {
    $this->postJson('/api/v1/appointments', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'first_name',
            'last_name',
            'phone_number',
            'address',
            'preferred_date',
            'preferred_time',
            'service_type',
            'consent',
        ]);
});

it('rejects booking when morning slot is full', function () use ($validPayload) {
    // Arrange — fill the slot to capacity
    Appointment::factory(10)->create([
        ...$validPayload(),
        'preferred_date' => '2026-06-01',
        'preferred_time' => 'morning',
    ]);

    // Act — 11th booking attempt
    $response = $this->postJson('/api/v1/appointments', [
        ...$validPayload(),
        'preferred_date' => '2026-06-01',
        'preferred_time' => 'morning',
    ]);

    // Assert
    $response->assertStatus(422)
        ->assertJsonPath('message', 'The morning slot on 2026-06-01 is fully booked.');
});
