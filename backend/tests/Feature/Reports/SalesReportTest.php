<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\Payment;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\User;
use App\Models\WorkJob;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\LaravelPdf\Facades\Pdf;

uses(RefreshDatabase::class);

function salesReportAdminUser(): User
{
    test()->seed(RoleAndPermissionSeeder::class);

    $user = User::factory()->create(['role' => 'admin']);
    $user->assignRole('admin');

    return $user;
}

it('returns sales report metrics, charts, tables, and export rows for admins', function () {
    $admin = salesReportAdminUser();
    $quotation = Quotation::factory()->noDiscount()->create();
    $workJob = WorkJob::factory()->create([
        'quotation_id' => $quotation->id,
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'phone_number' => '+63 912 345 6789',
        'email' => 'juan@example.test',
    ]);

    QuotationItem::factory()->approved()->create([
        'quotation_id' => $quotation->id,
        'name' => 'Sliding Door',
        'pieces' => 1,
        'amount_per_piece' => 7000,
        'options_amount' => 0,
        'total_amount' => 7000,
    ]);

    Payment::query()->create([
        'work_job_id' => $workJob->id,
        'quotation_id' => $quotation->id,
        'created_by' => $admin->id,
        'type' => PaymentType::FullPayment,
        'method' => PaymentMethod::Cash,
        'status' => PaymentStatus::Paid,
        'amount' => 7000,
        'currency' => 'PHP',
        'paid_at' => now(),
    ]);

    Payment::query()->create([
        'work_job_id' => $workJob->id,
        'quotation_id' => $quotation->id,
        'created_by' => $admin->id,
        'type' => PaymentType::AdditionalCharge,
        'method' => PaymentMethod::PayPal,
        'status' => PaymentStatus::Pending,
        'amount' => 1200,
        'currency' => 'PHP',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/v1/sales')
        ->assertOk()
        ->assertJsonPath('summary.gross_sales', 7000)
        ->assertJsonPath('summary.net_sales', 7000)
        ->assertJsonPath('summary.pending_amount', 1200)
        ->assertJsonPath('summary.paid_count', 1)
        ->assertJsonPath('summary.pending_count', 1)
        ->assertJsonPath('charts.payment_methods.0.method', 'Cash')
        ->assertJsonPath('charts.payment_types.0.type', 'Full Payment')
        ->assertJsonPath('charts.top_products.0.name', 'Sliding Door')
        ->assertJsonPath('tables.recent_payments.0.customer', 'Juan Dela Cruz')
        ->assertJsonPath('tables.top_customers.0.name', 'Juan Dela Cruz')
        ->assertJsonCount(2, 'export_rows');
});

it('prevents workers from viewing the sales report', function () {
    test()->seed(RoleAndPermissionSeeder::class);

    $worker = User::factory()->worker()->create();
    $worker->assignRole('worker');

    $this->actingAs($worker)
        ->getJson('/api/v1/sales')
        ->assertForbidden();
});

it('exports sales reports as real excel and csv downloads', function () {
    $admin = salesReportAdminUser();
    $quotation = Quotation::factory()->noDiscount()->create();
    $workJob = WorkJob::factory()->create([
        'quotation_id' => $quotation->id,
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'phone_number' => '+63 917 000 0000',
        'email' => 'maria@example.test',
    ]);

    QuotationItem::factory()->approved()->create([
        'quotation_id' => $quotation->id,
        'name' => 'Aluminum Window',
        'pieces' => 2,
        'amount_per_piece' => 4500,
        'options_amount' => 0,
        'total_amount' => 9000,
    ]);

    Payment::query()->create([
        'work_job_id' => $workJob->id,
        'quotation_id' => $quotation->id,
        'created_by' => $admin->id,
        'type' => PaymentType::FullPayment,
        'method' => PaymentMethod::Cash,
        'status' => PaymentStatus::Paid,
        'amount' => 9000,
        'currency' => 'PHP',
        'paid_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/api/v1/sales/export/xlsx')
        ->assertOk()
        ->assertHeaderContains('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        ->assertHeaderContains('content-disposition', '.xlsx');

    $this->actingAs($admin)
        ->get('/api/v1/sales/export/csv')
        ->assertOk()
        ->assertHeaderContains('content-disposition', '.csv');
});

it('exports the sales report as a pdf download', function () {
    Pdf::fake();

    $admin = salesReportAdminUser();
    $quotation = Quotation::factory()->noDiscount()->create();
    $workJob = WorkJob::factory()->create([
        'quotation_id' => $quotation->id,
        'first_name' => 'Pedro',
        'last_name' => 'Reyes',
    ]);

    Payment::query()->create([
        'work_job_id' => $workJob->id,
        'quotation_id' => $quotation->id,
        'created_by' => $admin->id,
        'type' => PaymentType::DownPayment,
        'method' => PaymentMethod::PayPal,
        'status' => PaymentStatus::Paid,
        'amount' => 2500,
        'currency' => 'PHP',
        'paid_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/api/v1/sales/export/pdf')
        ->assertOk();

    Pdf::assertRespondedWithPdf(fn ($pdf) => $pdf->contains('Sales Report'));
});
