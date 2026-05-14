<?php

use App\Enums\AppointmentStatus;
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

it('lets customers cancel but not delete appointments', function () {
    Mail::fake();

    $customer = User::factory()->create([
        'role' => 'customer',
        'email' => 'customer@gmail.com',
    ]);

    $appointment = Appointment::factory()->create([
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
