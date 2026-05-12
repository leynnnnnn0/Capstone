<?php

use App\Models\Appointment;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionGroup;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\User;
use App\Enums\AppointmentStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);

    // Create a confirmed appointment
    $this->appointment = Appointment::factory()->create([
        'status' => AppointmentStatus::Completed,
    ]);

    // Create a product with option group and option
    $this->product = Product::factory()->create([
        'name' => 'Glass Door',
        'description' => 'The best in town.',
        'unit' => 'sqm',
        'price_per_unit' => 1500,
        'is_active' => true
    ]);

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

$validPayload = fn() => [
    'appointment_id' => 1, // set in test using $this->appointment->id
    'notes'          => 'Please install carefully.',
    'discount'       => 500.00,
    'items'          => [
        [
            'product_id'       => 1, // set in test
            'name'             => 'Aluminum Glass Window',
            'description'      => '1.2m x 1.5m tempered glass window',
            'width'            => 1.2,
            'height'           => 1.5,
            'pieces'           => 2,
            'amount_per_piece' => 3000.00,
            'options_amount'   => 500.00,
            'total_amount'     => 7000.00,
            'notes'            => null,
            'selected_options' => [],
        ],
    ],
];

// ── Happy Path ────────────────────────────────────────────────────

it('creates a quotation successfully', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/quotations', [
            'appointment_id' => $this->appointment->id,
            'notes'          => 'Please install carefully.',
            'discount'       => 500.00,
            'items'          => [
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
        ])
        ->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => [
                'id',
                'appointment_id',
                'discount',
                'subtotal',
                'total',
                'items',
            ],
        ]);

    $this->assertDatabaseHas('quotations', [
        'appointment_id' => $this->appointment->id,
    ]);

    expect(Quotation::first()->quotation_items)->toHaveCount(1);
});

it('creates a quotation with multiple items', function () {
    $product2 = Product::factory()->create([
        'name' => 'Window Glass',
        'description' => 'The best window in town',
        'unit' => 'sqm',
        'price_per_unit' => 5000,
        'is_active' => true
    ]);

    $this->actingAs($this->admin)
        ->postJson('/api/v1/quotations', [
            'appointment_id' => $this->appointment->id,
            'items'          => [
                [
                    'product_id'       => $this->product->id,
                    'name'             => 'Window A',
                    'width'            => 1.2,
                    'height'           => 1.5,
                    'pieces'           => 1,
                    'amount_per_piece' => 3000.00,
                    'options_amount'   => 0,
                    'total_amount'     => 3000.00,
                    'selected_options' => [],
                ],
                [
                    'product_id'       => $product2->id,
                    'name'             => 'Window B',
                    'width'            => 2.0,
                    'height'           => 1.8,
                    'pieces'           => 2,
                    'amount_per_piece' => 2000.00,
                    'options_amount'   => 0,
                    'total_amount'     => 4000.00,
                    'selected_options' => [],
                ],
            ],
        ])
        ->assertStatus(201);

    expect(Quotation::first()->quotation_items)->toHaveCount(2);
});

it('creates a quotation with selected options and snapshots them', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/quotations', [
            'appointment_id' => $this->appointment->id,
            'items'          => [
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
                            'group_name'              => 'Glass Type',       // snapshot
                            'option_name'             => 'Tempered Glass',   // snapshot
                            'price_modifier'          => 500.00,             // snapshot
                        ],
                    ],
                ],
            ],
        ])
        ->assertStatus(201);

    $item = Quotation::first()->quotation_items->first();
    expect($item->options)->toHaveCount(1);

    // Verify snapshot values are stored correctly
    $option = $item->options->first();
    expect($option->group_name)->toBe('Glass Type');
    expect($option->option_name)->toBe('Tempered Glass');
    expect((float) $option->price_modifier)->toBe(500.00);
});

it('calculates subtotal and total correctly in response', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/quotations', [
            'appointment_id' => $this->appointment->id,
            'discount'       => 500.00,
            'items'          => [
                [
                    'product_id'       => $this->product->id,
                    'name'             => 'Window A',
                    'width'            => 1.0,
                    'height'           => 1.0,
                    'pieces'           => 2,
                    'amount_per_piece' => 3000.00,
                    'options_amount'   => 0,
                    'total_amount'     => 6000.00,
                    'selected_options' => [],
                ],
            ],
        ])
        ->assertStatus(201)
        ->assertJsonPath( 'data.subtotal', 6000)
        ->assertJsonPath( 'data.discount',  500)
        ->assertJsonPath( 'data.total',  5500);
});

// ── Update ────────────────────────────────────────────────────────

it('updates a quotation and replaces all items', function () {
    $quotation = Quotation::factory()->create([
        'appointment_id' => $this->appointment->id,
    ]);

    QuotationItem::factory(3)->create([
        'quotation_id' => $quotation->id,
        'product_id'   => $this->product->id,
    ]);

    $this->actingAs($this->admin)
        ->putJson("/api/v1/quotations/{$quotation->id}", [
            'notes'    => 'Updated notes.',
            'discount' => 0,
            'items'    => [
                [
                    'product_id'       => $this->product->id,
                    'name'             => 'New Window',
                    'width'            => 1.0,
                    'height'           => 1.0,
                    'pieces'           => 1,
                    'amount_per_piece' => 2000.00,
                    'options_amount'   => 0,
                    'total_amount'     => 2000.00,
                    'selected_options' => [],
                ],
            ],
        ])
        ->assertStatus(200);

    // Old 3 items replaced with 1 new item
    expect($quotation->fresh()->quotation_items)->toHaveCount(1);
});

// ── Item Status ───────────────────────────────────────────────────

it('updates quotation item status', function () {
    $quotation = Quotation::factory()->create([
        'appointment_id' => $this->appointment->id,
    ]);

    $item = QuotationItem::factory()->create([
        'quotation_id' => $quotation->id,
        'product_id'   => $this->product->id,
        'status'       => 'for_acceptance',
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/quotation-items/{$item->id}/status", [
            'status' => 'approved',
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'approved');

    expect($item->fresh()->status)->toBe('approved');
});

it('returns 422 when item status is invalid', function () {
    $quotation = Quotation::factory()->create([
        'appointment_id' => $this->appointment->id,
    ]);

    $item = QuotationItem::factory()->create([
        'quotation_id' => $quotation->id,
        'product_id'   => $this->product->id,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/quotation-items/{$item->id}/status", [
            'status' => 'invalid_status',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

// ── Validation ────────────────────────────────────────────────────

it('returns 422 when appointment does not exist', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/quotations', [
            'appointment_id' => 999,
            'items'          => [],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['appointment_id']);
});

it('returns 422 when items are empty', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/quotations', [
            'appointment_id' => $this->appointment->id,
            'items'          => [],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['items']);
});

it('returns 422 when product does not exist', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/quotations', [
            'appointment_id' => $this->appointment->id,
            'items'          => [
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

// ── Auth ──────────────────────────────────────────────────────────

