<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\WorkJobChargeStatus;
use App\Enums\WorkJobChargeType;
use App\Models\Payment;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\User;
use App\Models\WorkJobCharge;
use App\Models\WorkJob;
use App\Services\Payments\PayPalClient;
use App\Services\Payments\WorkJobPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function payableWorkJob(array $workJobAttributes = [], float $total = 10000): WorkJob
{
    $quotation = Quotation::factory()->noDiscount()->create();

    QuotationItem::factory()
        ->approved()
        ->create([
            'quotation_id' => $quotation->id,
            'amount_per_piece' => $total,
            'options_amount' => 0,
            'pieces' => 1,
            'total_amount' => $total,
        ]);

    return WorkJob::factory()->create(array_merge([
        'quotation_id' => $quotation->id,
    ], $workJobAttributes));
}

it('stores down payment terms when creating a work job', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $worker = User::factory()->worker()->create();

    $payload = [
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'phone_number' => '+63 912 345 6789',
        'address' => '123 Rizal Street, Bacoor, Cavite',
        'service_type' => 'installation',
        'scheduled_date' => now()->addDays(3)->format('Y-m-d'),
        'scheduled_time_from' => '09:00',
        'scheduled_time_until' => '11:00',
        'worker_ids' => [$worker->id],
        'is_down_payment_required' => true,
        'down_payment_percentage' => 35,
    ];

    $this->actingAs($admin)
        ->postJson('/api/v1/work-jobs', $payload)
        ->assertCreated()
        ->assertJsonPath('data.is_down_payment_required', true)
        ->assertJsonPath('data.down_payment_percentage', 35);

    expect(WorkJob::first())
        ->is_down_payment_required->toBeTrue()
        ->down_payment_percentage->toBe('35.00');
});

it('records a manual down payment and updates the payment summary', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = payableWorkJob([
        'is_down_payment_required' => true,
        'down_payment_percentage' => 20,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$workJob->id}/payments/manual", [
            'type' => PaymentType::DownPayment->value,
            'method' => PaymentMethod::Cash->value,
            'amount' => 2000,
            'remarks' => 'Cash collected at site.',
        ])
        ->assertOk()
        ->assertJsonPath('data.payment_summary.quotation_total', 10000)
        ->assertJsonPath('data.payment_summary.paid_amount', 2000)
        ->assertJsonPath('data.payment_summary.down_payment_remaining_amount', 0)
        ->assertJsonPath('data.payment_summary.next_due_type', PaymentType::FinalPayment->value);

    expect(Payment::query()->count())->toBe(1);
    expect(Payment::first())
        ->type->toBe(PaymentType::DownPayment)
        ->method->toBe(PaymentMethod::Cash)
        ->status->toBe(PaymentStatus::Paid);
    expect($workJob->remarks()->where('action', 'payment_paid')->exists())->toBeTrue();
});

it('prevents a final payment before the required down payment is completed', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = payableWorkJob([
        'is_down_payment_required' => true,
        'down_payment_percentage' => 20,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$workJob->id}/payments/manual", [
            'type' => PaymentType::FinalPayment->value,
            'method' => PaymentMethod::BankTransfer->value,
            'amount' => 8000,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);

    expect(Payment::query()->count())->toBe(0);
});

it('does not allow manual payments on cancelled work jobs', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = payableWorkJob([
        'status' => 'cancelled',
    ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$workJob->id}/payments/manual", [
            'type' => PaymentType::FullPayment->value,
            'method' => PaymentMethod::Cash->value,
            'amount' => 10000,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['payment']);
});

it('does not allow workers to record manual payments', function () {
    $worker = User::factory()->worker()->create();
    $workJob = payableWorkJob();

    $this->actingAs($worker)
        ->postJson("/api/v1/work-jobs/{$workJob->id}/payments/manual", [
            'type' => PaymentType::FullPayment->value,
            'method' => PaymentMethod::Cash->value,
            'amount' => 10000,
        ])
        ->assertForbidden();
});

it('adds approved work job charges to the payable balance', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = payableWorkJob(total: 7000);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$workJob->id}/charges", [
            'title' => 'Extra sealant and site protection',
            'type' => WorkJobChargeType::ServiceFee->value,
            'status' => WorkJobChargeStatus::Approved->value,
            'amount' => 850,
        ])
        ->assertCreated()
        ->assertJsonPath('data.payment_summary.quotation_total', 7000)
        ->assertJsonPath('data.payment_summary.approved_charges_total', 850)
        ->assertJsonPath('data.payment_summary.payable_total', 7850)
        ->assertJsonPath('data.payment_summary.remaining_amount', 7850);

    expect($workJob->charges()->count())->toBe(1);
    expect($workJob->remarks()->where('action', 'charge_created')->exists())->toBeTrue();
});

it('keeps pending approval charges out of the payable balance', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = payableWorkJob(total: 7000);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$workJob->id}/charges", [
            'title' => 'Possible delivery adjustment',
            'type' => WorkJobChargeType::Delivery->value,
            'status' => WorkJobChargeStatus::PendingApproval->value,
            'amount' => 500,
        ])
        ->assertCreated()
        ->assertJsonPath('data.payment_summary.pending_charges_total', 500)
        ->assertJsonPath('data.payment_summary.payable_total', 7000)
        ->assertJsonPath('data.payment_summary.remaining_amount', 7000);
});

it('uses additional charge payments for approved extras added after full payment', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = payableWorkJob(total: 7000);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$workJob->id}/payments/manual", [
            'type' => PaymentType::FullPayment->value,
            'method' => PaymentMethod::Cash->value,
            'amount' => 7000,
        ])
        ->assertOk()
        ->assertJsonPath('data.payment_summary.is_fully_paid', true);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$workJob->id}/charges", [
            'title' => 'Additional service fee',
            'type' => WorkJobChargeType::ServiceFee->value,
            'status' => WorkJobChargeStatus::Approved->value,
            'amount' => 500,
        ])
        ->assertCreated()
        ->assertJsonPath('data.payment_summary.remaining_amount', 500)
        ->assertJsonPath('data.payment_summary.next_due_type', PaymentType::AdditionalCharge->value)
        ->assertJsonPath('data.payment_summary.additional_charge_amount', 500);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$workJob->id}/payments/manual", [
            'type' => PaymentType::FullPayment->value,
            'method' => PaymentMethod::Cash->value,
            'amount' => 500,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$workJob->id}/payments/manual", [
            'type' => PaymentType::AdditionalCharge->value,
            'method' => PaymentMethod::Cash->value,
            'amount' => 500,
        ])
        ->assertOk()
        ->assertJsonPath('data.payment_summary.is_fully_paid', true);

    expect(Payment::query()->latest('id')->first())
        ->type->toBe(PaymentType::AdditionalCharge)
        ->amount->toBe('500.00');
});

it('does not re-bill the original quotation on back jobs', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $source = payableWorkJob(total: 7000);
    $backJob = WorkJob::factory()->create([
        'parent_work_job_id' => $source->id,
        'quotation_id' => $source->quotation_id,
        'is_down_payment_required' => false,
    ]);

    $this->actingAs($admin)
        ->getJson("/api/v1/work-jobs/{$backJob->id}")
        ->assertOk()
        ->assertJsonPath('data.payment_summary.quotation_total', 0)
        ->assertJsonPath('data.payment_summary.source_quotation_total', 7000)
        ->assertJsonPath('data.payment_summary.payable_total', 0)
        ->assertJsonPath('data.payment_summary.remaining_amount', 0)
        ->assertJsonPath('data.payment_summary.payment_not_required', true)
        ->assertJsonPath('data.payment_summary.can_accept_payment', false);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$backJob->id}/payments/manual", [
            'type' => PaymentType::FullPayment->value,
            'method' => PaymentMethod::Cash->value,
            'amount' => 7000,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['payment']);
});

it('collects only approved extra charges on back jobs', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $source = payableWorkJob(total: 7000);
    $backJob = WorkJob::factory()->create([
        'parent_work_job_id' => $source->id,
        'quotation_id' => $source->quotation_id,
        'is_down_payment_required' => false,
    ]);

    WorkJobCharge::create([
        'work_job_id' => $backJob->id,
        'created_by' => $admin->id,
        'approved_by' => $admin->id,
        'title' => 'Out-of-scope replacement hardware',
        'type' => WorkJobChargeType::ExtraMaterial,
        'status' => WorkJobChargeStatus::Approved,
        'amount' => 500,
        'currency' => 'PHP',
        'requires_customer_approval' => false,
        'approved_at' => now(),
    ]);

    $this->actingAs($admin)
        ->getJson("/api/v1/work-jobs/{$backJob->id}")
        ->assertOk()
        ->assertJsonPath('data.payment_summary.quotation_total', 0)
        ->assertJsonPath('data.payment_summary.source_quotation_total', 7000)
        ->assertJsonPath('data.payment_summary.approved_charges_total', 500)
        ->assertJsonPath('data.payment_summary.payable_total', 500)
        ->assertJsonPath('data.payment_summary.remaining_amount', 500)
        ->assertJsonPath('data.payment_summary.next_due_type', PaymentType::AdditionalCharge->value)
        ->assertJsonPath('data.payment_summary.additional_charge_amount', 500);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$backJob->id}/payments/manual", [
            'type' => PaymentType::FullPayment->value,
            'method' => PaymentMethod::Cash->value,
            'amount' => 500,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$backJob->id}/payments/manual", [
            'type' => PaymentType::AdditionalCharge->value,
            'method' => PaymentMethod::Cash->value,
            'amount' => 500,
        ])
        ->assertOk()
        ->assertJsonPath('data.payment_summary.is_fully_paid', true);
});

it('reuses a fresh pending paypal checkout for the same work job payment type and amount', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $workJob = payableWorkJob(total: 7000);

    $payPal = Mockery::mock(PayPalClient::class);
    $payPal->shouldReceive('configured')->twice()->andReturnTrue();
    $payPal->shouldReceive('currency')->once()->andReturn('PHP');
    $payPal->shouldReceive('createOrder')->once()->andReturn([
        'id' => 'ORDER-ONE',
        'status' => 'PAYER_ACTION_REQUIRED',
    ]);

    $service = new WorkJobPaymentService($payPal);

    $firstAttempt = $service->createPayPalOrder($workJob, PaymentType::FullPayment, $customer);
    $secondAttempt = $service->createPayPalOrder($workJob, PaymentType::FullPayment, $customer);
    $first = $firstAttempt['payment'];
    $second = $secondAttempt['payment'];

    expect($second->id)->toBe($first->id);
    expect($secondAttempt['order']['id'])->toBe('ORDER-ONE');
    expect($first->fresh()->status)->toBe(PaymentStatus::Pending);
    expect($second->fresh()->status)->toBe(PaymentStatus::Pending);
    expect($second->fresh()->provider_order_id)->toBe('ORDER-ONE');
    expect(Payment::query()
        ->where('work_job_id', $workJob->id)
        ->where('type', PaymentType::FullPayment->value)
        ->where('method', PaymentMethod::PayPal->value)
        ->where('status', PaymentStatus::Pending->value)
        ->count())->toBe(1);
});

it('cancels stale pending paypal checkout attempts when a new amount is due', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = payableWorkJob(total: 7000);

    $payPal = Mockery::mock(PayPalClient::class);
    $payPal->shouldReceive('configured')->twice()->andReturnTrue();
    $payPal->shouldReceive('currency')->twice()->andReturn('PHP');
    $payPal->shouldReceive('createOrder')->twice()->andReturn(
        ['id' => 'ORDER-ONE'],
        ['id' => 'ORDER-TWO'],
    );

    $service = new WorkJobPaymentService($payPal);

    $first = $service->createPayPalOrder($workJob, PaymentType::FullPayment, $customer)['payment'];

    WorkJobCharge::create([
        'work_job_id' => $workJob->id,
        'created_by' => $admin->id,
        'approved_by' => $admin->id,
        'title' => 'Additional sealant',
        'type' => WorkJobChargeType::ServiceFee,
        'status' => WorkJobChargeStatus::Approved,
        'amount' => 500,
        'currency' => 'PHP',
        'approved_at' => now(),
    ]);

    $second = $service->createPayPalOrder($workJob, PaymentType::FullPayment, $customer)['payment'];

    expect($first->fresh()->status)->toBe(PaymentStatus::Cancelled);
    expect($first->fresh()->remarks)->toBe('Superseded by a newer PayPal checkout session.');
    expect($second->fresh()->status)->toBe(PaymentStatus::Pending);
    expect($second->fresh()->provider_order_id)->toBe('ORDER-TWO');
    expect($second->fresh()->amount)->toBe('7500.00');
});

it('cancels pending paypal checkout attempts when an offline payment is recorded', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = payableWorkJob(total: 7000);

    $payPal = Mockery::mock(PayPalClient::class);
    $payPal->shouldReceive('configured')->once()->andReturnTrue();
    $payPal->shouldReceive('currency')->once()->andReturn('PHP');
    $payPal->shouldReceive('createOrder')->once()->andReturn(['id' => 'ORDER-ONE']);

    $service = new WorkJobPaymentService($payPal);
    $pending = $service->createPayPalOrder($workJob, PaymentType::FullPayment, $customer)['payment'];

    $this->actingAs($admin)
        ->postJson("/api/v1/work-jobs/{$workJob->id}/payments/manual", [
            'type' => PaymentType::FullPayment->value,
            'method' => PaymentMethod::Cash->value,
            'amount' => 7000,
            'remarks' => 'Paid at office.',
        ])
        ->assertOk()
        ->assertJsonPath('data.payment_summary.is_fully_paid', true);

    expect($pending->fresh()->status)->toBe(PaymentStatus::Cancelled);
    expect($pending->fresh()->remarks)->toBe('Cancelled because an offline payment changed the payable balance.');
});
