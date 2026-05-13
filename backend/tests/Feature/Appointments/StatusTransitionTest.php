<?php


use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin   = User::factory()->create(['role' => 'admin']);
    $this->workers = User::factory(2)->create(['role' => 'worker']);
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

// ── on_the_way ────────────────────────────────────────────────────

it('marks confirmed appointment as on the way', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status' => AppointmentStatus::Confirmed,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/on-the-way")
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'on_the_way');

    expect($appointment->fresh()->status)->toBe(AppointmentStatus::OnTheWay);
});

it('cannot mark pending appointment as on the way', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create($appointmentPayload());

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/on-the-way")
        ->assertStatus(422);
});

it('creates a remark when marked on the way', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status' => AppointmentStatus::Confirmed,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/on-the-way");

    expect($appointment->fresh()->remarks)->toHaveCount(1);
});

// ── in_progress ───────────────────────────────────────────────────

it('marks on the way appointment as in progress', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status' => AppointmentStatus::OnTheWay,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/in-progress")
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'in_progress');

    expect($appointment->fresh()->status)->toBe(AppointmentStatus::InProgress);
});

it('cannot mark confirmed appointment as in progress', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status' => AppointmentStatus::Confirmed,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/in-progress")
        ->assertStatus(422);
});

it('creates a remark when marked in progress', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status' => AppointmentStatus::OnTheWay,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/in-progress");

    expect($appointment->fresh()->remarks)->toHaveCount(1);
});

// ── completed ─────────────────────────────────────────────────────

it('marks in progress appointment as completed', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status' => AppointmentStatus::InProgress,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/complete")
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'completed');

    expect($appointment->fresh()->status)->toBe(AppointmentStatus::Completed);
});

it('cannot mark confirmed appointment as completed', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status' => AppointmentStatus::Confirmed,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/complete")
        ->assertStatus(422);
});

it('creates a remark when marked completed', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'status' => AppointmentStatus::InProgress,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/appointments/{$appointment->id}/complete");

    expect($appointment->fresh()->remarks)->toHaveCount(1);
});

