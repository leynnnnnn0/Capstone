<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    $this->admin = User::factory()->create(['role' => 'admin']);
});

it('updates a product with variants and option groups', function () {
    $product = Product::factory()->create([
        'name' => 'Old Window',
        'unit' => 'sqm',
    ]);
    $product->product_variants()->create([
        'width' => 80,
        'height' => 120,
        'price' => 1000,
        'is_active' => true,
    ]);
    $oldGroup = ProductOptionGroup::factory()->create([
        'product_id' => $product->id,
        'name' => 'Old Group',
    ]);
    ProductOption::factory()->create([
        'product_option_group_id' => $oldGroup->id,
        'name' => 'Old Option',
    ]);

    $categories = Category::factory(2)->create();

    $this->actingAs($this->admin)
        ->putJson("/api/v1/products/{$product->id}", [
            'name' => 'Updated Window',
            'description' => 'Updated description',
            'unit' => 'piece',
            'price_per_unit' => 2500,
            'is_active' => false,
            'category_ids' => $categories->pluck('id')->toArray(),
            'variants' => [
                ['width' => 100, 'height' => 150, 'price' => 3000],
                ['width' => 120, 'height' => 180, 'price' => 4500, 'is_active' => false],
            ],
            'option_groups' => [
                [
                    'name' => 'Glass Type',
                    'is_required' => true,
                    'sort_order' => 0,
                    'options' => [
                        ['name' => 'Clear Glass', 'price_modifier' => 0, 'sort_order' => 0],
                        ['name' => 'Tempered Glass', 'price_modifier' => 700, 'sort_order' => 1],
                    ],
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated Window')
        ->assertJsonPath('data.is_active', false);

    $product->refresh();

    expect($product->categories)->toHaveCount(2);
    expect($product->product_variants)->toHaveCount(2);
    expect($product->product_option_groups)->toHaveCount(1);
    expect($product->product_option_groups->first()->product_options)->toHaveCount(2);

    $this->assertDatabaseMissing('product_option_groups', ['name' => 'Old Group']);
    $this->assertDatabaseMissing('product_options', ['name' => 'Old Option']);
});

it('updates existing nested product records by id', function () {
    $product = Product::factory()->create();
    $variant = $product->product_variants()->create([
        'width' => 80,
        'height' => 120,
        'price' => 1000,
        'is_active' => true,
    ]);
    $variant->product_variant_images()->create([
        'image_path' => "products/{$product->id}/variants/{$variant->id}/old.jpg",
    ]);
    Storage::disk('public')->put(
        "products/{$product->id}/variants/{$variant->id}/old.jpg",
        'image-content'
    );

    $group = ProductOptionGroup::factory()->create([
        'product_id' => $product->id,
        'name' => 'Glass Type',
    ]);
    $keptOption = ProductOption::factory()->create([
        'product_option_group_id' => $group->id,
        'name' => 'Clear Glass',
    ]);
    $removedOption = ProductOption::factory()->create([
        'product_option_group_id' => $group->id,
        'name' => 'Removed Option',
    ]);

    $this->actingAs($this->admin)
        ->putJson("/api/v1/products/{$product->id}", [
            'variants' => [
                [
                    'id' => $variant->id,
                    'width' => 90,
                    'height' => 140,
                    'price' => 1800,
                    'is_active' => true,
                ],
            ],
            'option_groups' => [
                [
                    'id' => $group->id,
                    'name' => 'Updated Glass Type',
                    'is_required' => true,
                    'sort_order' => 0,
                    'options' => [
                        [
                            'id' => $keptOption->id,
                            'name' => 'Updated Clear Glass',
                            'price_modifier' => 100,
                            'sort_order' => 0,
                            'is_active' => true,
                        ],
                    ],
                ],
            ],
        ])
        ->assertOk();

    $this->assertDatabaseHas('product_variants', [
        'id' => $variant->id,
        'width' => 90,
        'price' => 1800,
    ]);
    $this->assertDatabaseHas('product_variant_images', [
        'product_variant_id' => $variant->id,
        'image_path' => "products/{$product->id}/variants/{$variant->id}/old.jpg",
    ]);
    Storage::disk('public')->assertExists(
        "products/{$product->id}/variants/{$variant->id}/old.jpg"
    );
    $this->assertDatabaseHas('product_option_groups', [
        'id' => $group->id,
        'name' => 'Updated Glass Type',
    ]);
    $this->assertDatabaseHas('product_options', [
        'id' => $keptOption->id,
        'name' => 'Updated Clear Glass',
    ]);
    $this->assertDatabaseMissing('product_options', [
        'id' => $removedOption->id,
    ]);
});

it('removes product and variant images during product update', function () {
    $product = Product::factory()->create();
    $productImage = $product->product_images()->create([
        'image_path' => "products/{$product->id}/old-product.jpg",
    ]);
    $variant = $product->product_variants()->create([
        'width' => 80,
        'height' => 120,
        'price' => 1000,
        'is_active' => true,
    ]);
    $variantImage = $variant->product_variant_images()->create([
        'image_path' => "products/{$product->id}/variants/{$variant->id}/old-variant.jpg",
    ]);

    Storage::disk('public')->put($productImage->image_path, 'product-image');
    Storage::disk('public')->put($variantImage->image_path, 'variant-image');

    $this->actingAs($this->admin)
        ->putJson("/api/v1/products/{$product->id}", [
            'deleted_image_ids' => [$productImage->id],
            'variants' => [
                [
                    'id' => $variant->id,
                    'width' => 80,
                    'height' => 120,
                    'price' => 1000,
                    'deleted_image_ids' => [$variantImage->id],
                ],
            ],
        ])
        ->assertOk();

    $this->assertDatabaseMissing('product_images', ['id' => $productImage->id]);
    $this->assertDatabaseMissing('product_variant_images', ['id' => $variantImage->id]);
    Storage::disk('public')->assertMissing($productImage->image_path);
    Storage::disk('public')->assertMissing($variantImage->image_path);
});

it('replaces a product 3d model during product update', function () {
    $product = Product::factory()->create();
    $oldModel = $product->product_3d_model()->create([
        'file_path' => "products/{$product->id}/models/old.glb",
        'original_name' => 'old.glb',
        'file_size' => 100,
        'mime_type' => 'model/gltf-binary',
    ]);

    Storage::disk('public')->put($oldModel->file_path, 'old-model');

    $this->actingAs($this->admin)
        ->call(
            'POST',
            "/api/v1/products/{$product->id}",
            ['_method' => 'PUT'],
            [],
            ['model_3d' => UploadedFile::fake()->create('new-door.glb', 32, 'model/gltf-binary')],
            ['CONTENT_TYPE' => 'multipart/form-data']
        )
        ->assertOk()
        ->assertJsonPath('data.model_3d.original_name', 'new-door.glb');

    $this->assertDatabaseMissing('product_3d_models', ['id' => $oldModel->id]);
    Storage::disk('public')->assertMissing($oldModel->file_path);
    Storage::disk('public')->assertExists($product->fresh()->product_3d_model->file_path);
});

it('removes a product 3d model during product update', function () {
    $product = Product::factory()->create();
    $model = $product->product_3d_model()->create([
        'file_path' => "products/{$product->id}/models/current.glb",
        'original_name' => 'current.glb',
        'file_size' => 100,
        'mime_type' => 'model/gltf-binary',
    ]);

    Storage::disk('public')->put($model->file_path, 'model');

    $this->actingAs($this->admin)
        ->putJson("/api/v1/products/{$product->id}", [
            'delete_3d_model' => true,
        ])
        ->assertOk()
        ->assertJsonPath('data.model_3d', null);

    $this->assertDatabaseMissing('product_3d_models', ['id' => $model->id]);
    Storage::disk('public')->assertMissing($model->file_path);
});

it('returns validation errors for invalid nested product update data', function () {
    $product = Product::factory()->create();

    $this->actingAs($this->admin)
        ->putJson("/api/v1/products/{$product->id}", [
            'variants' => [
                ['width' => -1, 'height' => 150, 'price' => 3000],
            ],
            'option_groups' => [
                [
                    'name' => '',
                    'options' => [
                        ['name' => '', 'price_modifier' => 'bad'],
                    ],
                ],
            ],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'variants.0.width',
            'option_groups.0.name',
            'option_groups.0.options.0.name',
            'option_groups.0.options.0.price_modifier',
        ]);
});
