<?php

use App\Enums\FabricationStatus;
use App\Models\User;
use App\Models\WorkJob;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function fabricationWorkJobPayload(User $worker, array $overrides = []): array
{
    return array_merge([
        'first_name' => 'Ana',
        'last_name' => 'Santos',
        'phone_number' => '+63 912 345 6789',
        'email' => 'ana@example.com',
        'address' => '123 Test Street, Bacoor, Cavite',
        'service_type' => 'installation',
        'scheduled_date' => now()->addDays(10)->format('Y-m-d'),
        'scheduled_time_from' => '09:00',
        'scheduled_time_until' => '11:00',
        'worker_ids' => [$worker->id],
        'is_down_payment_required' => false,
        'down_payment_percentage' => 20,
        'fabrication_status' => FabricationStatus::Pending->value,
        'fabrication_expected_completion_date' => now()->addDays(5)->format('Y-m-d'),
        'fabrication_notes' => 'Final measurements confirmed.',
    ], $overrides);
}

it('creates fabrication tracking while keeping down payment optional', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $worker = User::factory()->worker()->create();

    $this->actingAs($admin)
        ->postJson('/api/v1/work-jobs', fabricationWorkJobPayload($worker))
        ->assertCreated()
        ->assertJsonPath('data.is_down_payment_required', false)
        ->assertJsonPath('data.fabrication.status', 'pending')
        ->assertJsonPath('data.fabrication.status_label', 'Fabrication Planning')
        ->assertJsonPath('data.fabrication.progress_percentage', 10)
        ->assertJsonPath('data.fabrication.days_remaining', 5)
        ->assertJsonPath('data.fabrication.notes', 'Final measurements confirmed.');

    expect(WorkJob::first())
        ->is_down_payment_required->toBeFalse()
        ->fabrication_status->toBe(FabricationStatus::Pending);
});

it('requires an expected completion date when fabrication is active', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = WorkJob::factory()->create([
        'fabrication_status' => FabricationStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/fabrication", [
            'status' => FabricationStatus::InProgress->value,
            'notes' => 'Frames are being assembled.',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['expected_completion_date']);
});

it('updates fabrication progress, customer estimate, timestamps, and activity', function () {
    CarbonImmutable::setTestNow('2026-07-17 09:00:00');
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = WorkJob::factory()->create([
        'fabrication_status' => FabricationStatus::Queued,
        'fabrication_expected_completion_date' => '2026-07-22',
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/fabrication", [
            'status' => FabricationStatus::InProgress->value,
            'expected_completion_date' => '2026-07-20',
            'notes' => 'Glass cutting is complete; frame assembly is underway.',
        ])
        ->assertOk()
        ->assertJsonPath('data.fabrication.status', 'in_progress')
        ->assertJsonPath('data.fabrication.days_remaining', 3)
        ->assertJsonPath('data.fabrication.is_overdue', false)
        ->assertJsonPath('data.fabrication.progress_percentage', 70)
        ->assertJsonPath('data.fabrication.notes', 'Glass cutting is complete; frame assembly is underway.');

    $fresh = $workJob->fresh();

    expect($fresh->fabrication_started_at)->not->toBeNull()
        ->and($fresh->remarks()->where('action', 'fabrication_in_progress')->exists())->toBeTrue();

    CarbonImmutable::setTestNow();
});

it('marks fabrication ready for installation without requiring a future estimate', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = WorkJob::factory()->create([
        'fabrication_status' => FabricationStatus::QualityCheck,
        'fabrication_expected_completion_date' => now()->format('Y-m-d'),
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/fabrication", [
            'status' => FabricationStatus::ReadyForInstallation->value,
            'notes' => 'Quality check passed. Ready for installation scheduling.',
        ])
        ->assertOk()
        ->assertJsonPath('data.fabrication.status', 'ready_for_installation')
        ->assertJsonPath('data.fabrication.progress_percentage', 100)
        ->assertJsonPath('data.fabrication.completed_at', fn ($value) => filled($value));
});

it('requires a customer-visible reason when fabrication is placed on hold', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $workJob = WorkJob::factory()->create([
        'fabrication_status' => FabricationStatus::InProgress,
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/fabrication", [
            'status' => FabricationStatus::OnHold->value,
            'expected_completion_date' => now()->addDays(3)->format('Y-m-d'),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['notes']);
});

it('shows fabrication progress to the owning customer', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $workJob = WorkJob::factory()->create([
        'user_id' => $customer->id,
        'fabrication_status' => FabricationStatus::MaterialsPreparation,
        'fabrication_expected_completion_date' => now()->addDays(2)->format('Y-m-d'),
        'fabrication_notes' => 'Aluminum profiles are being prepared.',
    ]);

    $this->actingAs($customer)
        ->getJson("/api/v1/customer/work-jobs/{$workJob->id}")
        ->assertOk()
        ->assertJsonPath('data.fabrication.status', 'materials_preparation')
        ->assertJsonPath('data.fabrication.days_remaining', 2)
        ->assertJsonPath('data.fabrication.notes', 'Aluminum profiles are being prepared.');
});

it('does not let workers manage fabrication progress', function () {
    $worker = User::factory()->worker()->create();
    $workJob = WorkJob::factory()->create();
    $workJob->workers()->attach($worker);

    $this->actingAs($worker)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/fabrication", [
            'status' => FabricationStatus::InProgress->value,
            'expected_completion_date' => now()->addDays(3)->format('Y-m-d'),
        ])
        ->assertForbidden();
});
