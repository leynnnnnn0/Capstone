<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Product3DModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product3DModel>
 */
class Product3DModelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id'       => Product::factory(),
            'file_path'        => 'products/models/sample.glb',
            'original_name'    => 'sample.glb',
            'file_size'        => 1024,
            'mime_type'        => 'model/gltf-binary',
            'is_default'       => true,
            'material_targets' => null,
        ];
    }
}
