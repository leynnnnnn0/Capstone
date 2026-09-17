<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class Product3DModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ([
            'Premium Black Hanaloque Screen Door 01' => 'premium-black-hanaloque-screen-door-01.glb',
            'White Side Panel Screen Door 03' => 'white-side-panel-screen-door-03.glb',
            'Wood Finish Side Panel Screen Door 01' => 'wood-finish-side-panel-screen-door-01.glb',
            'White Glass-Front Pantry Cabinet' => 'white-glass-front-pantry-cabinet.glb',
            'White Under-Stair Pull-Out Cabinet' => 'white-under-stair-pull-out-cabinet.glb',
            'White L-Shaped Modular Kitchen Cabinet' => 'white-l-shaped-modular-kitchen-cabinet.glb',
            'Two-Tone Modular Kitchen Cabinet' => 'two-tone-modular-kitchen-cabinet.glb',
            'Analoque Brown Walk-In Wardrobe Cabinet' => 'analoque-brown-walk-in-wardrobe-cabinet.glb',
            'White Louvered Overhead Kitchen Cabinet' => 'white-louvered-overhead-kitchen-cabinet.glb',
            'Glossy Black Modular Kitchen Cabinet' => 'glossy-black-modular-kitchen-cabinet.glb',
            'Handleless White Modular Kitchen Cabinet' => 'handleless-white-modular-kitchen-cabinet.glb',
            'White Modular Entertainment Cabinet' => 'white-modular-entertainment-cabinet.glb',
            'White Sliding Glass Storage Cabinet' => 'white-sliding-glass-storage-cabinet.glb',
            'Customized Modular Cabinet' => 'customized-modular-cabinet.glb',
        ] as $name => $filename) {
            $this->seedModel(Product::where('name', $name)->firstOrFail(), $filename);
        }
    }

    private function seedModel(Product $product, string $filename): void
    {
        $source = database_path('seeders/assets/models/'.$filename);
        $path = 'products/'.$product->id.'/models/'.$filename;

        if (! Storage::disk('public')->put($path, file_get_contents($source))) {
            throw new \RuntimeException('Unable to store the seeded product model.');
        }

        $product->product_3d_model()->updateOrCreate(
            ['product_id' => $product->id],
            [
                'file_path' => $path,
                'original_name' => $filename,
                'file_size' => filesize($source),
                'mime_type' => 'model/gltf-binary',
                'is_default' => true,
                'material_targets' => null,
            ],
        );
    }
}
