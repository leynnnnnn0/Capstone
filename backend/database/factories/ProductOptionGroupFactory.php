<?php
// database/factories/ProductOptionGroupFactory.php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductOptionGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductOptionGroup>
 */
class ProductOptionGroupFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id'  => Product::factory(),
            'name'        => $this->faker->randomElement([
                'Glass Type',
                'Frame Color',
                'Screen Type',
                'Aluminum Type',
                'Thickness',
            ]),
            'is_required' => $this->faker->boolean(),
            'sort_order'  => $this->faker->numberBetween(1, 10),
        ];
    }

    public function required(): static
    {
        return $this->state(fn() => ['is_required' => true]);
    }

    public function optional(): static
    {
        return $this->state(fn() => ['is_required' => false]);
    }
}
