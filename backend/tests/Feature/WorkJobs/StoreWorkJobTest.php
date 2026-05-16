<?php
// tests/Feature/WorkJobs/StoreWorkJobTest.php

use App\Enums\WorkJobStatus;
use App\Models\Appointment;
use App\Models\Quotation;
use App\Models\User;
use App\Models\WorkJob;
use App\Enums\AppointmentStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin   = User::factory()->create(['role' => 'admin']);
    $this->workers = User::factory(2)->create(['role' => 'worker']);
});

$validPayload = fn() => [
    'first_name'           => 'Juan',
    'last_name'            => 'dela Cruz',
    'phone_number'         => '+63 912 345 6789',
    'address'              => '123 Rizal Street, Bacoor, Cavite',
    'service_type'         => 'repair',
    'scheduled_date'       => now()->addDays(3)->format('Y-m-d'),
    'scheduled_time_from'  => '09:00',
    'scheduled_time_until' => '11:00',
    'worker_ids'           => [],
];

// ── Happy Path ────────────────────────────────────────────────────

it('creates a work job successfully', function () use ($validPayload) {
    $payload = array_merge($validPayload(), [
        'worker_ids' => $this->workers->pluck('id')->toArray(),
    ]);

    $this->actingAs($this->admin)
        ->postJson('/api/v1/work-jobs', $payload)
        ->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => [
                'id',
                'work_job_number',
                'status',
                'status_label',
                'workers',
            ],
        ]);

    expect(WorkJob::count())->toBe(1);
    expect(WorkJob::first()->workers)->toHaveCount(2);
});

it('generates work job number automatically', function () use ($validPayload) {
    $response = $this->actingAs($this->admin)
        ->postJson('/api/v1/work-jobs', array_merge($validPayload(), [
            'worker_ids' => $this->workers->pluck('id')->toArray(),
        ]))
        ->assertStatus(201);

    expect($response->json('data.work_job_number'))
        ->toMatch('/^WJ-\d{6}-\d{8}$/');
});

it('creates work job with pending status by default', function () use ($validPayload) {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/work-jobs', array_merge($validPayload(), [
            'worker_ids' => $this->workers->pluck('id')->toArray(),
        ]))
        ->assertStatus(201)
        ->assertJsonPath('data.status', WorkJobStatus::Pending->value);
});

it('creates work job from appointment', function () {
    $workers     = User::factory(2)->create(['role' => 'worker']);
    $appointment = Appointment::factory()->create([
        'status'                 => AppointmentStatus::Confirmed,
        'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
        'appointment_time_from'  => '09:00',
        'appointment_time_until' => '11:00',
    ]);
    $appointment->workers()->sync($workers->pluck('id'));

    $this->actingAs($this->admin)
        ->postJson("/api/v1/appointments/{$appointment->id}/work-job")
        ->assertStatus(201)
        ->assertJsonPath('data.appointment_id', $appointment->id);

    $workJob = WorkJob::first();
    expect($workJob->first_name)->toBe($appointment->first_name);
    expect($workJob->workers)->toHaveCount(2);
    expect($appointment->remarks()->where('action', 'work_job_created')->exists())->toBeTrue();
});

it('creates work job from appointment with quotation', function () {
    $this->withoutExceptionHandling();
    $workers     = User::factory(2)->create(['role' => 'worker']);
    $appointment = Appointment::factory()->create([
        'status'                 => AppointmentStatus::Confirmed,
        'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
        'appointment_time_from'  => '09:00',
        'appointment_time_until' => '11:00',
    ]);
    $quotation = Quotation::factory()->create([
        'appointment_id' => $appointment->id,
    ]);
    $appointment->workers()->sync($workers->pluck('id'));

    $this->actingAs($this->admin)
        ->postJson("/api/v1/appointments/{$appointment->id}/work-job")
        ->assertStatus(201);

    $workJob = WorkJob::first();
    expect($workJob->quotation_id)->toBe($quotation->id);
});

// ── Validation ────────────────────────────────────────────────────

it('returns 422 when required fields are missing', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/work-jobs', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'first_name',
            'last_name',
            'phone_number',
            'service_type',
            'scheduled_date',
            'scheduled_time_from',
            'scheduled_time_until',
            'worker_ids',
        ]);
});

it('returns 422 when end time is before start time', function () use ($validPayload) {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/work-jobs', array_merge($validPayload(), [
            'scheduled_time_from'  => '14:00',
            'scheduled_time_until' => '10:00',
            'worker_ids'           => $this->workers->pluck('id')->toArray(),
        ]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['scheduled_time_until']);
});

it('returns 422 when worker does not exist', function () use ($validPayload) {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/work-jobs', array_merge($validPayload(), [
            'worker_ids' => [999],
        ]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['worker_ids.0']);
});
