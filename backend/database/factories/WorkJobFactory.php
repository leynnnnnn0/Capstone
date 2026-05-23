<?php
// database/factories/WorkJobFactory.php

namespace Database\Factories;

use App\Enums\WorkJobStatus;
use App\Models\WorkJob;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkJob>
 */
class WorkJobFactory extends Factory
{
    public function definition(): array
    {
        return [
            'work_job_number'      => 'WJ-' . str_pad($this->faker->unique()->numberBetween(1, 999999), 6, '0', STR_PAD_LEFT) . '-' . now()->format('Ymd'),
            'user_id'              => null,
            'appointment_id'       => null,
            'quotation_id'         => null,
            'first_name'           => $this->faker->firstName(),
            'last_name'            => $this->faker->lastName(),
            'phone_number'         => '+63 912 345 6789',
            'email'                => $this->faker->optional()->safeEmail(),
            'address'              => $this->faker->address(),
            'address_pinned'       => null,
            'address_lat'          => null,
            'address_lng'          => null,
            'service_type'         => $this->faker->randomElement(['repair', 'installation', 'maintenance']),
            'service_type_other'   => null,
            'scheduled_date'       => now()->addDays(3)->format('Y-m-d'),
            'scheduled_time_from'  => '09:00',
            'scheduled_time_until' => '11:00',
            'status'               => WorkJobStatus::Pending,
            'notes'                => $this->faker->optional()->sentence(),
        ];
    }

    public function inProgress(): static
    {
        return $this->state(fn() => ['status' => WorkJobStatus::InProgress]);
    }

    public function completed(): static
    {
        return $this->state(fn() => ['status' => WorkJobStatus::Completed]);
    }

    public function cancelled(): static
    {
        return $this->state(fn() => ['status' => WorkJobStatus::Cancelled]);
    }
}
