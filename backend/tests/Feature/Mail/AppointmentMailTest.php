<?php

// tests/Feature/Mail/AppointmentMailTest.php

use App\Mail\AppointmentConfirmedMail;
use App\Models\Appointment;
use App\Models\User;
use App\Enums\AppointmentStatus;
use App\Events\AppointmentConfirmed;
use App\Mail\Appointments\AppointmentBookedMail;
use App\Mail\Appointments\AppointmentCancelledMail;
use App\Mail\Appointments\AppointmentRescheduledMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
    $this->admin   = User::factory()->create(['role' => 'admin']);
    $this->workers = User::factory(2)->create(['role' => 'worker']);
});

$appointmentPayload = fn() => [
    'first_name'     => 'Juan',
    'last_name'      => 'dela Cruz',
    'email'          => 'juan@example.com',
    'phone_number'   => '+63 912 345 6789',
    'address'        => '123 Rizal Street, Bacoor, Cavite',
    'preferred_date' => now()->addDays(3)->format('Y-m-d'),
    'preferred_time' => 'morning',
    'service_type'   => 'repair',
    'consent'        => true,
];

// ── Booked ────────────────────────────────────────────────────────

it('queues confirmation email when appointment is booked', function () use ($appointmentPayload) {
    $response = $this->postJson('/api/appointments', [
        ...$appointmentPayload(),
        'email' => 'juan@gmail.com'
        ]);

    $response->assertStatus(201);

    Mail::assertQueued(AppointmentBookedMail::class, function ($mail) use ($response) {
        return $mail->hasTo('juan@gmail.com')
            && $mail->appointment->id === $response->json()['data']['id'];
    });
});


// ── Confirmed ─────────────────────────────────────────────────────

it('queues confirmation email when appointment is confirmed', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'email' => 'juan@example.com',
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/appointments/{$appointment->id}/confirm", [
            'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
            'appointment_time_from'  => '09:00',
            'appointment_time_until' => '11:00',
            'worker_ids'             => $this->workers->pluck('id')->toArray(),
        ]);


    Mail::assertQueued(AppointmentConfirmedMail::class, function ($mail) use ($appointment) {
        return $mail->hasTo('juan@example.com')
            && $mail->appointment->id === $appointment->id;
    });
});

// ── Rescheduled ───────────────────────────────────────────────────

it('queues email when appointment is rescheduled', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'email'  => 'juan@example.com',
        'status' => AppointmentStatus::Confirmed,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/appointments/{$appointment->id}/reschedule", [
            'appointment_date'       => now()->addDays(5)->format('Y-m-d'),
            'appointment_time_from'  => '10:00',
            'appointment_time_until' => '12:00',
            'reason'                 => 'Worker unavailable.',
        ]);


    Mail::assertQueued(AppointmentRescheduledMail::class, function ($mail) use ($appointment) {
        return $mail->hasTo('juan@example.com')
            && $mail->appointment->id === $appointment->id;
    });
});

// ── Cancelled ─────────────────────────────────────────────────────

it('sends email when appointment is cancelled', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'email' => 'juan@example.com',
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/appointments/{$appointment->id}/cancel", [
            'reason' => 'Customer requested cancellation.',
        ]);

    Mail::assertQueued(AppointmentCancelledMail::class, function ($mail) use ($appointment) {
        return $mail->hasTo('juan@example.com')
            && $mail->appointment->id === $appointment->id;
    });
});

// ── No email address ──────────────────────────────────────────────

it('does not send any mail when appointment has no email', function () use ($appointmentPayload) {
    $appointment = Appointment::factory()->create([
        ...$appointmentPayload(),
        'email' => null,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/appointments/{$appointment->id}/confirm", [
            'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
            'appointment_time_from'  => '09:00',
            'appointment_time_until' => '11:00',
            'worker_ids'             => $this->workers->pluck('id')->toArray(),
        ]);

    Mail::assertNothingSent();
});
