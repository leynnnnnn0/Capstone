<?php

use App\Models\Category;
use App\Models\Product;
use Database\Seeders\ModularCabinetSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('seeds the modular cabinet catalog with its category and images', function () {
    Storage::fake('public');

    $this->seed(ModularCabinetSeeder::class);
    $this->seed(ModularCabinetSeeder::class);

    $category = Category::where('name', 'Modular Cabinet')->firstOrFail();

    expect(Product::whereHas('categories', fn ($query) => $query->whereKey($category->id))->count())->toBe(11)
        ->and(Product::where('name', 'Customized Modular Cabinet')->count())->toBe(1)
        ->and(Product::where('name', 'Customized Modular Cabinet')->value('unit'))->toBe('meter')
        ->and(Product::where('name', 'Customized Modular Cabinet')->value('price_per_unit'))->toBe('18000.00');

    $wardrobe = Product::where('name', 'Analoque Brown Walk-In Wardrobe Cabinet')->firstOrFail();

    expect($wardrobe->product_images)->toHaveCount(2)
        ->and(Product::whereHas('categories', fn ($query) => $query->whereKey($category->id))
            ->withCount('product_images')
            ->get()
            ->sum('product_images_count'))->toBe(12);

    Storage::disk('public')->assertExists('products/modular-cabinets/customized-modular-cabinet.jpg');
});
