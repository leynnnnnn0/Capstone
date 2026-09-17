<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Database\Seeders\GateSeeder;
use Database\Seeders\ProductSeeder;
use Database\Seeders\RailSeeder;
use Database\Seeders\ShowerEnclosureSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('seeds each photo catalog with stable products, categories, and original images', function ($seeder, $categoryName, $folder, $count, $unit) {
    Storage::fake('public');
    $unrelated = Product::factory()->create(['name' => 'Existing unrelated product']);
    $this->seed($seeder);
    $ids = Product::where('id', '!=', $unrelated->id)->pluck('id')->all();
    $this->seed($seeder);

    $category = Category::where('name', $categoryName)->sole();
    $products = Product::whereHas('categories', fn ($q) => $q->whereKey($category->id))->with('product_images')->get();
    expect($products)->toHaveCount($count)
        ->and($products->pluck('id')->all())->toBe($ids)
        ->and(Product::count())->toBe($count + 1)
        ->and(ProductImage::count())->toBe($count);
    foreach ($products as $product) {
        expect($product->unit)->toBe($unit)
            ->and($product->is_active)->toBeTrue()
            ->and((float) $product->price_per_unit)->toBeGreaterThan(0)
            ->and($product->description)->toContain('Estimated starting price')
            ->and($product->product_images)->toHaveCount(1)
            ->and($product->product_images->first()->sort_order)->toBe(0);
        $path = $product->product_images->first()->image_path;
        expect($path)->toStartWith('products/'.$folder.'/product-');
        Storage::disk('public')->assertExists($path);
        expect(hash('sha256', Storage::disk('public')->get($path)))
            ->toBe(hash_file('sha256', database_path('seeders/assets/'.$path)));
    }
})->with([
    [GateSeeder::class, 'Gate', 'gates', 15, 'sqm'],
    [RailSeeder::class, 'Rail', 'rails', 5, 'meter'],
    [ShowerEnclosureSeeder::class, 'Shower Enclosure', 'shower-enclosures', 18, 'sqm'],
]);

it('preserves manually added photos and category assignments when reseeding', function () {
    Storage::fake('public');
    $this->seed(GateSeeder::class);
    $product = Product::where('name', 'Black Frame Wood-Finish Panel Gate 01')->sole();
    $category = Category::create(['name' => 'Featured']);
    $product->categories()->attach($category);
    $product->product_images()->create(['image_path' => 'manual/extra.jpg', 'sort_order' => 8]);
    $this->seed(GateSeeder::class);
    expect($product->product_images()->count())->toBe(2)
        ->and($product->categories()->whereKey($category->id)->exists())->toBeTrue();
});

it('does not accidentally seed the gate PNG as a screen door', function () {
    Storage::fake('public');
    $this->seed(ProductSeeder::class);
    expect(Product::count())->toBeGreaterThan(0)
        ->and(ProductImage::where('image_path', 'like', 'products/gates/%')->count())->toBe(0)
        ->and(ProductImage::where('image_path', 'like', 'products/rails/%')->count())->toBe(0)
        ->and(ProductImage::where('image_path', 'like', 'products/shower-enclosures/%')->count())->toBe(0);
});
