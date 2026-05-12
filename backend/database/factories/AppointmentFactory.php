<?php

namespace Database\Factories;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $counter = 1;

        return [
            'first_name'         => $this->faker->firstName(),
            'last_name'          => $this->faker->lastName(),
            'phone_number'       => '+63 912 345 6789',
            'address'            => $this->faker->address(),
            'preferred_date'     => now()->addDays(3)->format('Y-m-d'),
            'preferred_time'     => $this->faker->randomElement(['morning', 'afternoon']),
            'service_type'       => $this->faker->randomElement(['repair', 'installation', 'maintenance']),
            'consent'            => true,
            'consent_given_at'   => now(),
            'status'             => AppointmentStatus::Pending,
        ];
    }



}
