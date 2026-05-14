<?php

use App\Models\Appointment;
use App\Models\User;
use App\Enums\AppointmentStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin   = User::factory()->create(['role' => 'admin']);
    $this->workers = User::factory(3)->create(['role' => 'worker']);
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

$queryParams = fn() => [
    'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
    'appointment_time_from'  => '09:00',
    'appointment_time_until' => '11:00',
];

// ── Validation ────────────────────────────────────────────────────

it('returns 422 when required fields are missing', function () {
    $this->actingAs($this->admin)
        ->getJson('/api/v1/workers/available')
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'appointment_date',
            'appointment_time_from',
            'appointment_time_until',
        ]);
});

it('returns 422 when time until is before time from', function () use ($queryParams) {
    $this->actingAs($this->admin)
        ->getJson('/api/v1/workers/available?' . http_build_query([
            ...$queryParams(),
            'appointment_time_until' => '08:00', // before 09:00
        ]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['appointment_time_until']);
});


// ── Happy Path ────────────────────────────────────────────────────

it('returns all workers when none are booked', function () use ($queryParams) {
    $response = $this->actingAs($this->admin)
        ->getJson('/api/v1/workers/available?' . http_build_query($queryParams()));

    $response->assertStatus(200)
        ->assertJsonCount(4, 'data');
});

it('excludes workers already assigned to a conflicting appointment', function () use ($appointmentPayload, $queryParams) {
    // Arrange — assign 2 workers to a conflicting appointment
    $conflictingAppointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status'                 => AppointmentStatus::Confirmed,
        'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
        'appointment_time_from'  => '09:00',
        'appointment_time_until' => '11:00',
    ]);

    $conflictingAppointment->workers()->sync(
        $this->workers->take(2)->pluck('id')
    );

    // Act
    $response = $this->actingAs($this->admin)
        ->getJson('/api/v1/workers/available?' . http_build_query($queryParams()));

    // Assert — 1 worker plus the admin are free
    $response->assertStatus(200)
        ->assertJsonCount(2, 'data');
});

it('includes workers whose appointments do not overlap', function () use ($appointmentPayload, $queryParams) {
    // Arrange — worker assigned to a non-overlapping time
    $nonConflictingAppointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status'                 => AppointmentStatus::Confirmed,
        'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
        'appointment_time_from'  => '13:00', // after our query window 09:00-11:00
        'appointment_time_until' => '15:00',
    ]);

    $nonConflictingAppointment->workers()->sync(
        $this->workers->take(2)->pluck('id')
    );

    // Act — query for 09:00-11:00
    $response = $this->actingAs($this->admin)
        ->getJson('/api/v1/workers/available?' . http_build_query($queryParams()));

    // Assert — all 3 workers plus the admin are still available
    $response->assertStatus(200)
        ->assertJsonCount(4, 'data');
});

it('excludes workers only from confirmed on_the_way and in_progress appointments', function () use ($appointmentPayload, $queryParams) {
    // Arrange — worker on a completed appointment (should not block)
    $completedAppointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status'                 => AppointmentStatus::Completed,
        'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
        'appointment_time_from'  => '09:00',
        'appointment_time_until' => '11:00',
    ]);

    $completedAppointment->workers()->sync(
        $this->workers->take(2)->pluck('id')
    );

    // Act
    $response = $this->actingAs($this->admin)
        ->getJson('/api/v1/workers/available?' . http_build_query($queryParams()));

    // Assert — all 3 workers plus the admin are available since completed doesn't block
    $response->assertStatus(200)
        ->assertJsonCount(4, 'data');
});

it('excludes current appointment from conflict check when rescheduling', function () use ($appointmentPayload, $queryParams) {
    // Arrange — create appointment with 2 workers assigned
    $currentAppointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status'                 => AppointmentStatus::Confirmed,
        'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
        'appointment_time_from'  => '09:00',
        'appointment_time_until' => '11:00',
    ]);

    $currentAppointment->workers()->sync(
        $this->workers->take(2)->pluck('id')
    );

    // Act — pass appointment_id to exclude it from conflict check
    $response = $this->actingAs($this->admin)
        ->getJson('/api/v1/workers/available?' . http_build_query([
            ...$queryParams(),
            'appointment_id' => $currentAppointment->id,
        ]));

    // Assert — all 3 workers plus the admin are available because current appointment is excluded
    $response->assertStatus(200)
        ->assertJsonCount(4, 'data');
});

it('includes admins as assignable workers', function () use ($queryParams) {
    $response = $this->actingAs($this->admin)
        ->getJson('/api/v1/workers/available?' . http_build_query($queryParams()));

    $response->assertStatus(200)
        ->assertJsonFragment([
            'id' => $this->admin->id,
            'full_name' => $this->admin->full_name,
        ]);
});

it('returns correct worker fields', function () use ($queryParams) {
    $response = $this->actingAs($this->admin)
        ->getJson('/api/v1/workers/available?' . http_build_query($queryParams()));

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'full_name']
            ]
        ]);
});
