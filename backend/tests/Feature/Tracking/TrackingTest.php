<?php

use App\Models\Appointment;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionGroup;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\QuotationItemOption;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('tracks an appointment by appointment number', function () {
    $appointment = Appointment::factory()->create([
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'email' => 'juan@example.com',
        'service_type' => 'quotation',
    ]);
    $worker = User::factory()->create(['role' => 'worker']);
    $appointment->workers()->attach($worker->id);
    $appointment->remarks()->create([
        'user_id' => $worker->id,
        'action' => 'confirmed',
        'message' => 'Appointment confirmed.',
    ]);

    $product = Product::factory()->create();
    $group = ProductOptionGroup::factory()->create([
        'product_id' => $product->id,
        'name' => 'Glass Type',
    ]);
    $option = ProductOption::factory()->create([
        'product_option_group_id' => $group->id,
        'name' => 'Tempered Glass',
    ]);
    $quotation = Quotation::factory()->create([
        'appointment_id' => $appointment->id,
        'discount' => 100,
        'notes' => 'Valid for 7 days.',
    ]);
    $item = QuotationItem::factory()->create([
        'quotation_id' => $quotation->id,
        'product_id' => $product->id,
        'name' => 'Sliding Door',
        'width' => 120,
        'height' => 240,
        'pieces' => 1,
        'total_amount' => 6000,
    ]);
    QuotationItemOption::create([
        'quotation_item_id' => $item->id,
        'product_option_group_id' => $group->id,
        'product_option_id' => $option->id,
        'group_name' => 'Glass Type',
        'option_name' => 'Tempered Glass',
        'price_modifier' => 500,
    ]);

    $this->getJson("/api/v1/track?reference={$appointment->appointment_number}")
        ->assertOk()
        ->assertJsonPath('data.type', 'appointment')
        ->assertJsonPath('data.reference_number', $appointment->appointment_number)
        ->assertJsonPath('data.full_name', 'Juan Dela Cruz')
        ->assertJsonPath('data.items.0.name', 'Sliding Door')
        ->assertJsonPath('data.items.0.options.0', 'Tempered Glass')
        ->assertJsonPath('data.grand_total', 5900)
        ->assertJsonPath('data.workers.0', $worker->full_name)
        ->assertJsonPath('data.remarks.0.message', 'Appointment confirmed.');
});

it('tracks a work job by work job number', function () {
    $quotation = Quotation::factory()->create();
    $workJob = WorkJob::factory()->create([
        'quotation_id' => $quotation->id,
        'first_name' => 'Maria',
        'last_name' => 'Santos',
    ]);

    QuotationItem::factory()->create([
        'quotation_id' => $quotation->id,
        'name' => 'Window',
        'total_amount' => 2500,
    ]);

    $this->getJson("/api/v1/track?reference={$workJob->work_job_number}")
        ->assertOk()
        ->assertJsonPath('data.type', 'work_job')
        ->assertJsonPath('data.reference_number', $workJob->work_job_number)
        ->assertJsonPath('data.full_name', 'Maria Santos')
        ->assertJsonPath('data.items.0.name', 'Window');
});

it('returns 404 for an unknown tracking reference', function () {
    $this->getJson('/api/v1/track?reference=APT-UNKNOWN')
        ->assertNotFound()
        ->assertJsonPath('message', 'We could not find a request with that reference number.');
});
