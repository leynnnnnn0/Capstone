<?php
// tests/Feature/Products/StoreProductTest.php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    $this->admin = User::factory()->create(['role' => 'admin']);
});

$validPayload = fn() => [
    'name'           => 'Aluminum Glass Window',
    'description'    => 'High quality aluminum frame with tempered glass.',
    'unit'           => 'sqm',
    'price_per_unit' => 1500.00,
    'is_active'      => true,
];

// ── Happy Path ────────────────────────────────────────────────────

it('creates a basic product successfully', function () use ($validPayload) {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/products', $validPayload())
        ->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'name', 'unit', 'price_per_unit', 'is_active'],
        ]);

    $this->assertDatabaseHas('products', [
        'name' => 'Aluminum Glass Window',
        'unit' => 'sqm',
    ]);
});

it('creates a product with categories', function () use ($validPayload) {
    $categories = Category::factory(2)->create();

    $this->actingAs($this->admin)
        ->postJson('/api/v1/products', [
            ...$validPayload(),
            'category_ids' => $categories->pluck('id')->toArray(),
        ])
        ->assertStatus(201);

    expect(Product::first()->categories)->toHaveCount(2);
});

it('creates a product with images', function () use ($validPayload) {
    $this->actingAs($this->admin)
        ->call(
            'POST',
            '/api/v1/products',
            $validPayload(),
            [],
            ['images' => [
                UploadedFile::fake()->image('window1.jpg'),
                UploadedFile::fake()->image('window2.jpg'),
            ]],
            ['CONTENT_TYPE' => 'multipart/form-data']
        )
        ->assertStatus(201);

    expect(Product::first()->product_images)->toHaveCount(2);

    Storage::disk('public')->assertExists(
        Product::first()->product_images->first()->image_path
    );
});

it('creates a product with variants', function () use ($validPayload) {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/products', [
            ...$validPayload(),
            'variants' => [
                ['width' => 1.0, 'height' => 1.2, 'price' => 1800.00],
                ['width' => 1.5, 'height' => 2.0, 'price' => 3000.00],
            ],
        ])
        ->assertStatus(201);

    expect(Product::first()->product_variants)->toHaveCount(2);
});

it('creates a product with option groups and options', function () use ($validPayload) {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/products', [
            ...$validPayload(),
            'option_groups' => [
                [
                    'name'        => 'Glass Type',
                    'is_required' => true,
                    'sort_order'  => 1,
                    'options'     => [
                        ['name' => 'Clear Glass',    'price_modifier' => 0,   'sort_order' => 1],
                        ['name' => 'Tempered Glass', 'price_modifier' => 500, 'sort_order' => 2],
                    ],
                ],
            ],
        ])
        ->assertStatus(201);

    $product = Product::first();
    expect($product->product_option_groups)->toHaveCount(1);
    expect($product->product_option_groups->first()->product_options)->toHaveCount(2);
});

it('creates a complete product with everything', function () use ($validPayload) {
    $categories = Category::factory(2)->create();

    $this->actingAs($this->admin)
        ->postJson('/api/v1/products', [
            ...$validPayload(),
            'category_ids' => $categories->pluck('id')->toArray(),
            'variants'     => [
                ['width' => 1.0, 'height' => 1.2, 'price' => 1800.00],
            ],
            'option_groups' => [
                [
                    'name'        => 'Glass Type',
                    'is_required' => true,
                    'sort_order'  => 1,
                    'options'     => [
                        ['name' => 'Clear Glass', 'price_modifier' => 0, 'sort_order' => 1],
                    ],
                ],
            ],
        ])
        ->assertStatus(201);

    $product = Product::first();
    expect($product->categories)->toHaveCount(2);
    expect($product->product_variants)->toHaveCount(1);
    expect($product->product_option_groups)->toHaveCount(1);
});

// ── Validation ────────────────────────────────────────────────────

it('returns 422 when required fields are missing', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/products', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'name',
            'description',
            'unit',
            'price_per_unit',
        ]);
});

it('returns 422 when unit is invalid', function () use ($validPayload) {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/products', [
            ...$validPayload(),
            'unit' => 'invalid',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['unit']);
});

it('returns 422 when price is negative', function () use ($validPayload) {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/products', [
            ...$validPayload(),
            'price_per_unit' => -100,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['price_per_unit']);
});

it('returns 422 when category does not exist', function () use ($validPayload) {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/products', [
            ...$validPayload(),
            'category_ids' => [999],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['category_ids.0']);
});

