<?php

use App\Models\Product;
use Database\Seeders\GateSeeder;
use Database\Seeders\ShowerEnclosureSeeder;
use Database\Seeders\ShowerGate3DModelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('attaches all 18 shower models and all 15 gates without duplicate records', function () {
    Storage::fake('public');
    $this->seed([GateSeeder::class, ShowerEnclosureSeeder::class]);
    $before = Product::with('product_images')->get()->mapWithKeys(fn ($p) => [$p->id => [$p->description, $p->price_per_unit, $p->product_images->pluck('image_path')->all()]]);
    $this->seed(ShowerGate3DModelSeeder::class);
    $this->seed(ShowerGate3DModelSeeder::class);
    $products = Product::with(['product_3d_model', 'product_images', 'categories'])->get();
    $count = 0;
    foreach ($products as $product) {
        $gate = $product->categories->contains('name', 'Gate');
        $number = (int) substr($product->name, -2);
        expect([$product->description, $product->price_per_unit, $product->product_images->pluck('image_path')->all()])->toBe($before[$product->id]);
        $count++;
        expect($product->product_3d_model()->count())->toBe(1);
        $model = $product->product_3d_model;
        $data = Storage::disk('public')->get($model->file_path);
        expect(substr($data, 0, 4))->toBe('glTF')
            ->and(strlen($data))->toBe($model->file_size);
        $jsonLength = unpack('V', substr($data, 12, 4))[1];
        $gltf = json_decode(substr($data, 20, $jsonLength), true, 512, JSON_THROW_ON_ERROR);
        expect($gltf['extras']['dimensionsAssumed'])->toBeTrue();
        if ($gate) {
            expect($gltf['extras']['planarAssembly'])->toBeTrue()
                ->and($gltf['extras']['dimensionsMeters'][2])->toBeLessThan(.15);
        }
        $this->get('/api/v1/product-3d-models/'.$model->id.'/file')->assertOk();
    }
    expect($count)->toBe(33);
});
