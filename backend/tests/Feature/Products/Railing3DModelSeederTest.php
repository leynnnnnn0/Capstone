<?php

use App\Models\Product;
use Database\Seeders\Railing3DModelSeeder;
use Database\Seeders\RailSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('seeds all five railing models with thin straight profiles and a real corner return', function () {
    Storage::fake('public');
    $this->seed(RailSeeder::class);
    $before = Product::get()->keyBy('id');
    $this->seed(Railing3DModelSeeder::class);
    $this->seed(Railing3DModelSeeder::class);
    expect(Product::count())->toBe(5);
    foreach (Product::with('product_3d_model')->get() as $product) {
        expect($product->product_3d_model()->count())->toBe(1)
            ->and($product->description)->toBe($before[$product->id]->description)
            ->and($product->price_per_unit)->toBe($before[$product->id]->price_per_unit)
            ->and($product->product_images()->count())->toBe(1);
        $model = $product->product_3d_model;
        $resource = (new \App\Http\Resources\Product3DModelResource($model))->resolve();
        expect($resource['file_url'])->toContain('?v='.$model->updated_at->format('Uu'));
        $model->updated_at = $model->updated_at->copy()->addSecond();
        $updatedResource = (new \App\Http\Resources\Product3DModelResource($model))->resolve();
        expect($updatedResource['file_url'])->not->toBe($resource['file_url']);
        $data = Storage::disk('public')->get($model->file_path);
        expect(substr($data, 0, 4))->toBe('glTF')->and(strlen($data))->toBe($model->file_size);
        $length = unpack('V', substr($data, 12, 4))[1];
        $metadata = json_decode(substr($data, 20, $length), true, 512, JSON_THROW_ON_ERROR);
        expect($metadata['extras']['dimensionsAssumed'])->toBeTrue();
        $depth = $metadata['extras']['dimensionsMeters'][2];
        if (in_array(substr($product->name, -2), ['01', '02', '04'])) {
            expect($depth)->toBeGreaterThan(1);
        } else {
            expect($depth)->toBeLessThan(.15);
        }
        $panels = collect($metadata['meshes'])->filter(fn ($mesh) => str_ends_with($mesh['name'], 'Clear glass infill'))
            ->sum(fn ($mesh) => $metadata['accessors'][$mesh['primitives'][0]['indices']]['count'] / 6);
        $number = substr($product->name, -2);
        expect((int) $panels)->toBe(['01' => 6, '02' => 2, '03' => 4, '04' => 6, '05' => 2][$number]);
        if (in_array($number, ['01', '04'])) {
            $widths = [];
            $counts = [];
            foreach ($metadata['meshes'] as $mesh) {
                if (! str_ends_with($mesh['name'], 'Clear glass infill')) {
                    continue;
                }
                $primitive = $mesh['primitives'][0];
                $accessor = $metadata['accessors'][$primitive['attributes']['POSITION']];
                $view = $metadata['bufferViews'][$accessor['bufferView']];
                $offset = 28 + $length + ($view['byteOffset'] ?? 0) + ($accessor['byteOffset'] ?? 0);
                $floats = array_values(unpack('g*', substr($data, $offset, $accessor['count'] * 12)));
                // Each glass quad has four consecutive vertices, in world meters.
                for ($j = 0; $j < count($floats); $j += 12) {
                    $widths[] = sqrt(($floats[$j + 3] - $floats[$j]) ** 2 + ($floats[$j + 5] - $floats[$j + 2]) ** 2);
                }
                $counts[] = $accessor['count'] / 4;
            }
            sort($counts);
            expect($counts)->toBe([2, 4])
                ->and(max($widths) - min($widths))->toBeLessThan(.00001);
        }
        if ($number === '01') {
            expect($metadata['extras']['dimensionsMeters'][0])->toBeGreaterThan(4)
                ->and($depth)->toBeGreaterThan(2);
        }
        $this->get('/api/v1/product-3d-models/'.$model->id.'/file')->assertOk();
    }
});
