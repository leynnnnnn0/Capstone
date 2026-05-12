<?php
// database/factories/QuotationFactory.php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Quotation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quotation>
 */
class QuotationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'appointment_id' => Appointment::factory(),
            'discount'       => $this->faker->randomFloat(2, 0, 1000),
            'notes'          => $this->faker->optional()->sentence(),
        ];
    }

    public function noDiscount(): static
    {
        return $this->state(fn() => ['discount' => 0]);
    }
}
