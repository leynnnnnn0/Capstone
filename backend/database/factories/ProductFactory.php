<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'           => $this->faker->words(3, true),
            'description'    => $this->faker->paragraph(),
            'unit'           => $this->faker->randomElement(['sqm', 'meter', 'piece', 'set']),
            'price_per_unit' => $this->faker->randomFloat(2, 100, 50000),
            'is_active'      => true,
        ];
    }

    // ── States ────────────────────────────────────────────────────

    public function inactive(): static
    {
        return $this->state(fn() => ['is_active' => false]);
    }
}
