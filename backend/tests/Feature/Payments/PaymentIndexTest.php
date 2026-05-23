<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\Payment;
use App\Models\User;
use App\Models\WorkJob;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function paymentAdminUser(): User
{
    test()->seed(RoleAndPermissionSeeder::class);

    $user = User::factory()->create(['role' => 'admin']);
    $user->assignRole('admin');

    return $user;
}

it('lists paginated payments with summary data for admins', function () {
    $admin = paymentAdminUser();
    $workJob = WorkJob::factory()->create([
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'phone_number' => '+63 912 345 6789',
        'email' => 'juan@example.test',
    ]);

    Payment::query()->create([
        'work_job_id' => $workJob->id,
        'created_by' => $admin->id,
        'type' => PaymentType::DownPayment,
        'method' => PaymentMethod::Cash,
        'status' => PaymentStatus::Paid,
        'amount' => 2500,
        'currency' => 'PHP',
        'paid_at' => now(),
        'remarks' => 'Cash down payment.',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/v1/payments?search=Juan')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('summary.total_count', 1)
        ->assertJsonPath('summary.paid_count', 1)
        ->assertJsonPath('summary.total_paid', 2500)
        ->assertJsonPath('data.0.work_job.full_name', 'Juan Dela Cruz')
        ->assertJsonPath('data.0.type', PaymentType::DownPayment->value)
        ->assertJsonPath('data.0.method', PaymentMethod::Cash->value)
        ->assertJsonPath('data.0.status', PaymentStatus::Paid->value);
});

it('hides cancelled checkout attempts by default but keeps them filterable', function () {
    $admin = paymentAdminUser();
    $workJob = WorkJob::factory()->create();

    Payment::query()->create([
        'work_job_id' => $workJob->id,
        'type' => PaymentType::FullPayment,
        'method' => PaymentMethod::PayPal,
        'status' => PaymentStatus::Paid,
        'amount' => 7000,
        'currency' => 'PHP',
        'paid_at' => now(),
    ]);

    Payment::query()->create([
        'work_job_id' => $workJob->id,
        'type' => PaymentType::FullPayment,
        'method' => PaymentMethod::PayPal,
        'status' => PaymentStatus::Cancelled,
        'amount' => 7000,
        'currency' => 'PHP',
        'remarks' => 'Superseded by a completed PayPal payment.',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/v1/payments')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('summary.total_count', 1)
        ->assertJsonPath('summary.paid_count', 1);

    $this->actingAs($admin)
        ->getJson('/api/v1/payments?status=cancelled')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.status', PaymentStatus::Cancelled->value);
});

it('prevents workers from viewing all payments', function () {
    test()->seed(RoleAndPermissionSeeder::class);

    $worker = User::factory()->worker()->create();
    $worker->assignRole('worker');

    $this->actingAs($worker)
        ->getJson('/api/v1/payments')
        ->assertForbidden();
});
