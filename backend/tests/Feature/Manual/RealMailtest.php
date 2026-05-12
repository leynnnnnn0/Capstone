<?php


use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('actually sends confirmation email and sms to real inbox', function () {
    config(['mail.default' => 'smtp']);
    
    $admin   = User::factory()->create(['role' => 'admin']);
    $workers = User::factory(2)->create(['role' => 'worker']);

    $appointment = Appointment::factory()->create([
        'first_name'     => 'Nathaniel',
        'last_name'      => 'Alvarez',
        'email'          => 'nathanielalvarez1234569@gmail.com',
        'phone_number'   => '+639266887267',
        'address'        => '123 Rizal Street, Bacoor, Cavite',
        'preferred_date' => now()->addDays(3)->format('Y-m-d'),
        'preferred_time' => 'morning',
        'service_type'   => 'repair',
        'consent'        => true,
    ]);


    $response = $this->actingAs($admin)
        ->patchJson("/api/appointments/{$appointment->id}/confirm", [
            'appointment_date'       => now()->addDays(3)->format('Y-m-d'),
            'appointment_time_from'  => '09:00',
            'appointment_time_until' => '11:00',
            'worker_ids'             => $workers->pluck('id')->toArray(),
        ]);
    
    $response->assertStatus(200);

    expect(true)->toBeTrue();
});
