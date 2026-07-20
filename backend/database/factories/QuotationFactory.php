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
            'expires_at'     => null,
        ];
    }

    public function noDiscount(): static
    {
        return $this->state(fn() => ['discount' => 0]);
    }

    public function withExpiration(?string $date = null): static
    {
        return $this->state(fn () => [
            'expires_at' => $date ?? now()->addDays(30)->toDateString(),
        ]);
    }
}
