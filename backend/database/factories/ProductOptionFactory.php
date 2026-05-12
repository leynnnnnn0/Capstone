<?php
// database/factories/ProductOptionFactory.php

namespace Database\Factories;

use App\Models\ProductOption;
use App\Models\ProductOptionGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductOption>
 */
class ProductOptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_option_group_id' => ProductOptionGroup::factory(),
            'name'                    => $this->faker->randomElement([
                'Clear Glass',
                'Tempered Glass',
                'Frosted Glass',
                'Aluminum Screen',
                'Fiberglass Screen',
                'White Frame',
                'Brown Frame',
            ]),
            'price_modifier' => $this->faker->randomFloat(2, 0, 2000),
            'sort_order'     => $this->faker->numberBetween(1, 10),
            'is_active'      => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn() => ['is_active' => false]);
    }
}
