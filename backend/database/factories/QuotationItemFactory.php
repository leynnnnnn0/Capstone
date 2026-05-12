<?php
// database/factories/QuotationItemFactory.php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Quotation;
use App\Models\QuotationItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuotationItem>
 */
class QuotationItemFactory extends Factory
{
    public function definition(): array
    {
        $pieces         = $this->faker->numberBetween(1, 10);
        $amountPerPiece = $this->faker->randomFloat(2, 500, 10000);
        $optionsAmount  = $this->faker->randomFloat(2, 0, 1000);
        $totalAmount    = ($amountPerPiece + $optionsAmount) * $pieces;

        return [
            'quotation_id'     => Quotation::factory(),
            'product_id'       => Product::factory(),
            'name'             => $this->faker->words(3, true),
            'description'      => $this->faker->optional()->sentence(),
            'width'            => $this->faker->randomFloat(2, 0.5, 5.0),
            'height'           => $this->faker->randomFloat(2, 0.5, 5.0),
            'thickness'        => $this->faker->optional()->randomFloat(2, 3, 12),
            'pieces'           => $pieces,
            'amount_per_piece' => $amountPerPiece,
            'options_amount'   => $optionsAmount,
            'total_amount'     => $totalAmount,
            'status'           => 'for_acceptance',
            'notes'            => $this->faker->optional()->sentence(),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn() => ['status' => 'approved']);
    }

    public function rejected(): static
    {
        return $this->state(fn() => ['status' => 'rejected']);
    }
}
