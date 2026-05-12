<?php

use App\Models\Appointment;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionGroup;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->product = Product::factory()->create();

    $this->optionGroup = ProductOptionGroup::factory()->create([
        'product_id'  => $this->product->id,
        'name'        => 'Glass Type',
        'is_required' => true,
        'sort_order'  => 1,
    ]);

    $this->option = ProductOption::factory()->create([
        'product_option_group_id' => $this->optionGroup->id,
        'name'                    => 'Tempered Glass',
        'price_modifier'          => 500.00,
        'sort_order'              => 1,
        'is_active'               => true,
    ]);
});

$appointmentPayload = fn() => [
    'first_name'     => 'Juan',
    'last_name'      => 'dela Cruz',
    'phone_number'   => '+63 912 345 6789',
    'address'        => '123 Rizal Street, Bacoor, Cavite',
    'preferred_date' => now()->addDays(3)->format('Y-m-d'),
    'preferred_time' => 'morning',
    'service_type'   => 'repair',
    'consent'        => true,
];

// ── Happy Path ────────────────────────────────────────────────────

it('creates appointment without items', function () use ($appointmentPayload) {
    $this->postJson('/api/appointments', $appointmentPayload())
        ->assertStatus(201)
        ->assertJsonPath('data.has_quotation', false);

    expect(Quotation::count())->toBe(0);
});

it('creates appointment with quotation items', function () use ($appointmentPayload) {
    $response = $this->postJson('/api/appointments', [
        ...$appointmentPayload(),
        'items' => [
            [
                'product_id'       => $this->product->id,
                'name'             => 'Aluminum Glass Window',
                'width'            => 1.2,
                'height'           => 1.5,
                'pieces'           => 2,
                'amount_per_piece' => 3000.00,
                'options_amount'   => 0,
                'total_amount'     => 6000.00,
                'selected_options' => [],
            ],
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.has_quotation', true)
        ->assertJsonStructure([
            'data' => [
                'quotation' => [
                    'id',
                    'items',
                    'subtotal',
                    'total',
                ],
            ],
        ]);

    expect(Quotation::count())->toBe(1);
    expect(Appointment::first()->quotation->quotation_items)->toHaveCount(1);
});

it('creates appointment with items and selected options snapshots them', function () use ($appointmentPayload) {
    $this->postJson('/api/appointments', [
        ...$appointmentPayload(),
        'items' => [
            [
                'product_id'       => $this->product->id,
                'name'             => 'Aluminum Glass Window',
                'width'            => 1.2,
                'height'           => 1.5,
                'pieces'           => 1,
                'amount_per_piece' => 3000.00,
                'options_amount'   => 500.00,
                'total_amount'     => 3500.00,
                'selected_options' => [
                    [
                        'product_option_group_id' => $this->optionGroup->id,
                        'product_option_id'       => $this->option->id,
                        'group_name'              => 'Glass Type',
                        'option_name'             => 'Tempered Glass',
                        'price_modifier'          => 500.00,
                    ],
                ],
            ],
        ],
    ])->assertStatus(201);

    $item = Appointment::first()->quotation->quotation_items->first();
    expect($item->options)->toHaveCount(1);
    expect($item->options->first()->group_name)->toBe('Glass Type');
    expect($item->options->first()->option_name)->toBe('Tempered Glass');
});

it('creates appointment with multiple items', function () use ($appointmentPayload) {
    $product2 = Product::factory()->create();

    $this->postJson('/api/appointments', [
        ...$appointmentPayload(),
        'items' => [
            [
                'product_id'       => $this->product->id,
                'name'             => 'Window A',
                'width'            => 1.0,
                'height'           => 1.0,
                'pieces'           => 1,
                'amount_per_piece' => 2000.00,
                'options_amount'   => 0,
                'total_amount'     => 2000.00,
                'selected_options' => [],
            ],
            [
                'product_id'       => $product2->id,
                'name'             => 'Window B',
                'width'            => 2.0,
                'height'           => 1.5,
                'pieces'           => 2,
                'amount_per_piece' => 3000.00,
                'options_amount'   => 0,
                'total_amount'     => 6000.00,
                'selected_options' => [],
            ],
        ],
    ])->assertStatus(201);

    expect(Appointment::first()->quotation->quotation_items)->toHaveCount(2);
});

// ── Validation ────────────────────────────────────────────────────

it('returns 422 when item product does not exist', function () use ($appointmentPayload) {
    $this->postJson('/api/appointments', [
        ...$appointmentPayload(),
        'items' => [
            [
                'product_id'       => 999,
                'name'             => 'Fake Product',
                'pieces'           => 1,
                'amount_per_piece' => 100,
                'total_amount'     => 100,
                'selected_options' => [],
            ],
        ],
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['items.0.product_id']);
});

it('returns 422 when items array is empty', function () use ($appointmentPayload) {
    $this->postJson('/api/appointments', [
        ...$appointmentPayload(),
        'items' => [], // empty array should fail min:1
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['items']);
});
