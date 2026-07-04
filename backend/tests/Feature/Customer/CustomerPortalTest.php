<?php

use App\Enums\AppointmentStatus;
use App\Enums\WorkJobStatus;
use App\Models\Appointment;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

it('lists only appointments belonging to the authenticated customer', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
        'email' => 'customer@gmail.com',
        'phone_number' => '+639123456789',
    ]);

    $own = Appointment::factory()->create([
        'user_id' => $customer->id,
        'email' => 'customer@gmail.com',
        'phone_number' => '+63 912 345 6789',
    ]);

    Appointment::factory()->create([
        'email' => 'other@gmail.com',
        'phone_number' => '+63 999 999 9999',
    ]);

    $this->actingAs($customer)
        ->getJson('/api/v1/customer/appointments')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $own->id);
});

it('allows a customer to create an appointment without quote items', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
        'email' => 'customer@gmail.com',
        'phone_number' => '+639123456789',
    ]);

    $this->actingAs($customer)
        ->postJson('/api/v1/customer/appointments', [
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'phone_number' => '+639123456789',
            'address' => '123 Test Street',
            'preferred_date' => now()->addDays(3)->format('Y-m-d'),
            'preferred_time' => 'afternoon',
            'service_type' => 'inspection',
            'consent' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.status', 'pending');
});

it('allows customer edits only while appointment is pending', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
        'email' => 'customer@gmail.com',
    ]);

    $appointment = Appointment::factory()->create([
        'user_id' => $customer->id,
        'email' => 'customer@gmail.com',
        'status' => AppointmentStatus::Confirmed,
    ]);

    $this->actingAs($customer)
        ->putJson("/api/v1/customer/appointments/{$appointment->id}", [
            'first_name' => $appointment->first_name,
            'last_name' => $appointment->last_name,
            'phone_number' => $appointment->phone_number,
            'address' => 'Updated Address',
            'preferred_date' => now()->addDays(4)->format('Y-m-d'),
            'preferred_time' => 'morning',
            'service_type' => 'inspection',
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Only pending appointments can be edited.');
});

it('lets customers reschedule confirmed appointments before work job creation', function () {
    Mail::fake();

    $customer = User::factory()->create([
        'role' => 'customer',
        'email' => 'customer@gmail.com',
    ]);

    $appointment = Appointment::factory()->create([
        'user_id' => $customer->id,
        'email' => 'customer@gmail.com',
        'status' => AppointmentStatus::Confirmed,
        'appointment_date' => now()->addDays(2)->format('Y-m-d'),
        'appointment_time_from' => '09:00',
        'appointment_time_until' => '11:00',
    ]);

    $newDate = now()->addDays(5)->format('Y-m-d');

    $this->actingAs($customer)
        ->patchJson("/api/v1/customer/appointments/{$appointment->id}/reschedule", [
            'appointment_date' => $newDate,
            'appointment_time_from' => '13:00',
            'appointment_time_until' => '15:00',
            'reason' => 'Customer requested a later inspection slot.',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'rescheduled')
        ->assertJsonPath('data.appointment_date', $newDate)
        ->assertJsonPath('data.appointment_time_from', '13:00')
        ->assertJsonPath('data.appointment_time_until', '15:00')
        ->assertJsonPath('data.can_reschedule', false);

    expect($appointment->fresh()->remarks()->where('action', 'rescheduled')->exists())->toBeTrue();
});

it('lets customers cancel but not delete appointments', function () {
    Mail::fake();

    $customer = User::factory()->create([
        'role' => 'customer',
        'email' => 'customer@gmail.com',
    ]);

    $appointment = Appointment::factory()->create([
        'user_id' => $customer->id,
        'email' => 'customer@gmail.com',
        'status' => AppointmentStatus::Pending,
    ]);

    $this->actingAs($customer)
        ->deleteJson("/api/v1/customer/appointments/{$appointment->id}")
        ->assertStatus(405);

    $this->actingAs($customer)
        ->patchJson("/api/v1/customer/appointments/{$appointment->id}/cancel", [
            'reason' => 'Need to reschedule later.',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelled');
});

it('lists customer work jobs without allowing creation', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
        'phone_number' => '+639123456789',
    ]);

    $workJob = WorkJob::factory()->create([
        'user_id' => $customer->id,
        'phone_number' => '+63 912 345 6789',
    ]);

    $this->actingAs($customer)
        ->getJson('/api/v1/customer/work-jobs')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $workJob->id);

    $this->actingAs($customer)
        ->postJson('/api/v1/customer/work-jobs', [])
        ->assertStatus(405);
});

it('lets customers rate completed work jobs', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
        'phone_number' => '+639123456789',
    ]);

    $workJob = WorkJob::factory()->completed()->create([
        'user_id' => $customer->id,
        'phone_number' => '+63 912 345 6789',
    ]);

    $this->actingAs($customer)
        ->postJson("/api/v1/customer/work-jobs/{$workJob->id}/rating", [
            'rating' => 4,
            'comment' => 'Good service.',
        ])
        ->assertOk()
        ->assertJsonPath('data.rating.rating', 4)
        ->assertJsonPath('data.rating.comment', 'Good service.');

    expect($workJob->fresh()->rating?->rating)->toBe(4);
});

it('does not let customers rate unfinished work jobs', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $workJob = WorkJob::factory()->create([
        'user_id' => $customer->id,
        'status' => WorkJobStatus::Confirmed,
    ]);

    $this->actingAs($customer)
        ->postJson("/api/v1/customer/work-jobs/{$workJob->id}/rating", [
            'rating' => 5,
        ])
        ->assertStatus(422)
        ->assertJsonPath('errors.rating.0', 'You can rate a work job only after it is completed.');
});

it('prevents customers from accessing staff appointment endpoints', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $this->actingAs($customer)
        ->getJson('/api/v1/appointments')
        ->assertForbidden();
});
