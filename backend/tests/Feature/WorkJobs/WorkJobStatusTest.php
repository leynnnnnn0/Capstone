<?php
// tests/Feature/WorkJobs/WorkJobStatusTest.php

use App\Enums\WorkJobStatus;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

// ── In Progress ───────────────────────────────────────────────────

it('marks pending work job as in progress', function () {
    $workJob = WorkJob::factory()->create();

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/in-progress")
        ->assertStatus(200)
        ->assertJsonPath('data.status', WorkJobStatus::InProgress->value);

    expect($workJob->fresh()->status)->toBe(WorkJobStatus::InProgress);
});

it('cannot mark completed work job as in progress', function () {
    $workJob = WorkJob::factory()->completed()->create();

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/in-progress")
        ->assertStatus(422);
});

// ── Complete ──────────────────────────────────────────────────────

it('marks in progress work job as completed', function () {
    $workJob = WorkJob::factory()->inProgress()->create();

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/complete")
        ->assertStatus(200)
        ->assertJsonPath('data.status', WorkJobStatus::Completed->value);

    expect($workJob->fresh()->status)->toBe(WorkJobStatus::Completed);
});

it('cannot mark pending work job as completed', function () {
    $workJob = WorkJob::factory()->create();

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/complete")
        ->assertStatus(422);
});

// ── Cancel ────────────────────────────────────────────────────────

it('cancels a pending work job', function () {
    $workJob = WorkJob::factory()->create();

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/cancel")
        ->assertStatus(200)
        ->assertJsonPath('data.status', WorkJobStatus::Cancelled->value);
});

it('cancels an in progress work job', function () {
    $workJob = WorkJob::factory()->inProgress()->create();

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/cancel")
        ->assertStatus(200);
});

it('cannot cancel a completed work job', function () {
    $workJob = WorkJob::factory()->completed()->create();

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/cancel")
        ->assertStatus(422);
});

