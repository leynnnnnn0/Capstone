<?php

use App\Enums\WorkJobBackJobReason;
use App\Enums\WorkJobStatus;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->workers = User::factory(2)->create(['role' => 'worker']);
});

function backJobPayload($workers): array
{
    return [
        'scheduled_date' => now()->addDays(2)->format('Y-m-d'),
        'scheduled_time_from' => '13:00',
        'scheduled_time_until' => '15:00',
        'worker_ids' => $workers->pluck('id')->toArray(),
        'back_job_reason' => WorkJobBackJobReason::WarrantyClaim->value,
        'back_job_details' => 'Replace loose sealant and align the panel under warranty.',
        'notes' => 'Bring sealant and drill bits.',
    ];
}

it('creates a back job from a completed work job', function () {
    $source = WorkJob::factory()->completed()->create([
        'first_name' => 'Nathaniel',
        'last_name' => 'Alvarez',
        'address' => 'General Trias, Cavite',
    ]);

    $this->actingAs($this->admin)
        ->postJson("/api/v1/work-jobs/{$source->id}/back-jobs", backJobPayload($this->workers))
        ->assertStatus(201)
        ->assertJsonPath('data.parent_work_job_id', $source->id)
        ->assertJsonPath('data.is_back_job', true)
        ->assertJsonPath('data.status', WorkJobStatus::Pending->value)
        ->assertJsonPath('data.back_job_reason', WorkJobBackJobReason::WarrantyClaim->value);

    $backJob = WorkJob::where('parent_work_job_id', $source->id)->first();

    expect($backJob)->not->toBeNull();
    expect($backJob->first_name)->toBe('Nathaniel');
    expect($backJob->address)->toBe('General Trias, Cavite');
    expect($backJob->workers)->toHaveCount(2);
    expect($source->fresh()->remarks()->where('action', 'back_job_created')->exists())->toBeTrue();
    expect($backJob->remarks()->where('action', 'back_job_created')->exists())->toBeTrue();
});

it('allows an unfinished-work back job while the original work job is in progress', function () {
    $source = WorkJob::factory()->inProgress()->create();

    $this->actingAs($this->admin)
        ->postJson("/api/v1/work-jobs/{$source->id}/back-jobs", array_merge(backJobPayload($this->workers), [
            'back_job_reason' => WorkJobBackJobReason::UnfinishedWork->value,
            'back_job_details' => 'Installation paused because it was already late. Return to finish tomorrow.',
        ]))
        ->assertStatus(201);
});

it('blocks non unfinished-work back jobs while the original job is still in progress', function () {
    $source = WorkJob::factory()->inProgress()->create();

    $this->actingAs($this->admin)
        ->postJson("/api/v1/work-jobs/{$source->id}/back-jobs", backJobPayload($this->workers))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['back_job_reason']);
});

it('does not create a back job from pending or cancelled work jobs', function () {
    $pending = WorkJob::factory()->create();
    $cancelled = WorkJob::factory()->cancelled()->create();

    $this->actingAs($this->admin)
        ->postJson("/api/v1/work-jobs/{$pending->id}/back-jobs", backJobPayload($this->workers))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['work_job']);

    $this->actingAs($this->admin)
        ->postJson("/api/v1/work-jobs/{$cancelled->id}/back-jobs", backJobPayload($this->workers))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['work_job']);
});

it('prevents workers from creating back jobs', function () {
    $source = WorkJob::factory()->completed()->create();

    $this->actingAs($this->workers->first())
        ->postJson("/api/v1/work-jobs/{$source->id}/back-jobs", backJobPayload($this->workers))
        ->assertStatus(403);
});
