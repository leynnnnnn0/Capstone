<?php

use App\Models\Product;
use Database\Seeders\Window3DModelSeeder;
use Database\Seeders\WindowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('seeds ten windows with original photos and thin photo-referenced models idempotently', function () {
    Storage::fake('public');
    foreach (range(1, 2) as $run) {
        $this->seed(WindowSeeder::class);
        $this->seed(Window3DModelSeeder::class);
    }
    expect(Product::count())->toBe(10);
    foreach (Product::with('product_3d_model', 'product_images', 'categories')->get() as $product) {
        expect($product->categories->pluck('name')->all())->toBe(['Window'])
            ->and($product->unit)->toBe('sqm')
            ->and($product->price_per_unit)->toBeGreaterThan(0)
            ->and($product->product_images)->toHaveCount(1)
            ->and($product->product_3d_model()->count())->toBe(1);
        $photo = $product->product_images->first()->image_path;
        expect(Storage::disk('public')->get($photo))->toBe(file_get_contents(database_path('seeders/assets/'.$photo)));
        $model = $product->product_3d_model;
        $data = Storage::disk('public')->get($model->file_path);
        expect(substr($data, 0, 4))->toBe('glTF')->and(strlen($data))->toBe($model->file_size);
        $length = unpack('V', substr($data, 12, 4))[1];
        $doc = json_decode(substr($data, 20, $length), true, 512, JSON_THROW_ON_ERROR);
        expect($doc['extras']['dimensionsAssumed'])->toBeTrue()
            ->and($doc['extras']['units'])->toBe('meters')
            ->and($doc['extras']['dimensionsMeters'][2])->toBeLessThan(.4);
        $this->get('/api/v1/product-3d-models/'.$model->id.'/file')->assertOk();
    }
});
