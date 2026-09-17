<?php

use App\Models\Product;
use Database\Seeders\ModularCabinetSeeder;
use Database\Seeders\Product3DModelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('attaches and serves generated product GLBs without duplicating models on reseed', function () {
    Storage::fake('public');
    $products = collect([
        'Premium Black Hanaloque Screen Door 01',
        'White Side Panel Screen Door 03',
        'Wood Finish Side Panel Screen Door 01',
        'White Glass-Front Pantry Cabinet',
        'White Under-Stair Pull-Out Cabinet',
        'White L-Shaped Modular Kitchen Cabinet',
        'Two-Tone Modular Kitchen Cabinet',
        'Analoque Brown Walk-In Wardrobe Cabinet',
        'White Louvered Overhead Kitchen Cabinet',
        'Glossy Black Modular Kitchen Cabinet',
        'Handleless White Modular Kitchen Cabinet',
        'White Modular Entertainment Cabinet',
        'White Sliding Glass Storage Cabinet',
        'Customized Modular Cabinet',
    ])->map(fn ($name) => Product::factory()->create(['name' => $name]));
    $this->seed(Product3DModelSeeder::class);
    $this->seed(Product3DModelSeeder::class);
    foreach ($products as $product) {
        expect($product->product_3d_model()->count())->toBe(1);
        $model = $product->product_3d_model;
        $contents = Storage::disk('public')->get($model->file_path);
        expect(substr($contents, 0, 4))->toBe('glTF')
            ->and(strlen($contents))->toBe($model->file_size);
        $this->get('/api/v1/product-3d-models/'.$model->id.'/file')->assertOk();
    }
});

it('covers every seeded modular cabinet without changing its catalog data', function () {
    Storage::fake('public');
    foreach (['Premium Black Hanaloque Screen Door 01', 'White Side Panel Screen Door 03', 'Wood Finish Side Panel Screen Door 01'] as $name) {
        Product::factory()->create(['name' => $name]);
    }
    $this->seed(ModularCabinetSeeder::class);
    $cabinets = Product::whereHas('categories', fn ($query) => $query->where('name', 'Modular Cabinet'))->get();
    expect($cabinets)->toHaveCount(11);
    $before = $cabinets->mapWithKeys(fn ($product) => [$product->id => [
        $product->description,
        $product->price_per_unit,
        $product->product_images()->pluck('image_path')->all(),
    ]]);
    $this->seed(Product3DModelSeeder::class);
    foreach ($cabinets as $product) {
        $product->refresh();
        expect($product->product_3d_model()->count())->toBe(1)
            ->and([
                $product->description,
                $product->price_per_unit,
                $product->product_images()->pluck('image_path')->all(),
            ])->toBe($before[$product->id]);
    }
});
