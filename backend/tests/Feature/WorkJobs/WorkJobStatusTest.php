<?php
// tests/Feature/WorkJobs/WorkJobStatusTest.php

use App\Enums\WorkJobStatus;
use App\Models\User;
use App\Models\WorkJob;
use App\Models\WorkJobWarranty;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

it('confirms a pending work job', function () {
    $workJob = WorkJob::factory()->create(['status' => WorkJobStatus::Pending]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/confirm", [
            'remarks' => 'Work job schedule confirmed.',
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.status', WorkJobStatus::Confirmed->value);

    expect($workJob->fresh()->status)->toBe(WorkJobStatus::Confirmed);
});

it('marks confirmed work job as on the way', function () {
    $workJob = WorkJob::factory()->create(['status' => WorkJobStatus::Confirmed]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/on-the-way")
        ->assertStatus(200)
        ->assertJsonPath('data.status', WorkJobStatus::OnTheWay->value);

    expect($workJob->fresh()->status)->toBe(WorkJobStatus::OnTheWay);
});

it('marks on the way work job as in progress', function () {
    $workJob = WorkJob::factory()->create(['status' => WorkJobStatus::OnTheWay]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/in-progress", [
            'remarks' => 'Installer started site preparation.',
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.status', WorkJobStatus::InProgress->value);

    expect($workJob->fresh()->status)->toBe(WorkJobStatus::InProgress);
    expect($workJob->fresh()->remarks)->toHaveCount(1);
    expect($workJob->fresh()->remarks()->first()->action)->toBe(WorkJobStatus::InProgress->value);
    expect($workJob->fresh()->remarks()->first()->user_id)->toBe($this->admin->id);
    expect($workJob->fresh()->remarks()->first()->message)->toBe('Installer started site preparation.');
});

it('cannot mark confirmed work job as in progress', function () {
    $workJob = WorkJob::factory()->create(['status' => WorkJobStatus::Confirmed]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/in-progress")
        ->assertStatus(422);
});

it('marks in progress work job as completed', function () {
    $workJob = WorkJob::factory()->inProgress()->create();

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/complete")
        ->assertStatus(200)
        ->assertJsonPath('data.status', WorkJobStatus::Completed->value)
        ->assertJsonPath('data.warranty.status', 'active');

    expect($workJob->fresh()->status)->toBe(WorkJobStatus::Completed);
    expect($workJob->fresh()->warranty()->exists())->toBeTrue();
    expect($workJob->fresh()->remarks)->toHaveCount(1);
    expect($workJob->fresh()->remarks()->first()->action)->toBe(WorkJobStatus::Completed->value);
});

it('does not issue a separate warranty for completed back jobs', function () {
    $source = WorkJob::factory()->completed()->create();
    $backJob = WorkJob::factory()->inProgress()->create([
        'parent_work_job_id' => $source->id,
    ]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$backJob->id}/complete")
        ->assertStatus(200)
        ->assertJsonPath('data.status', WorkJobStatus::Completed->value)
        ->assertJsonPath('data.warranty', null);

    expect(
        WorkJobWarranty::query()->where('work_job_id', $backJob->id)->exists()
    )->toBeFalse();
});

it('cannot mark pending work job as completed', function () {
    $workJob = WorkJob::factory()->create(['status' => WorkJobStatus::Pending]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/complete")
        ->assertStatus(422);
});

it('cancels a confirmed work job', function () {
    $workJob = WorkJob::factory()->create(['status' => WorkJobStatus::Confirmed]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/cancel")
        ->assertStatus(200)
        ->assertJsonPath('data.status', WorkJobStatus::Cancelled->value);

    expect($workJob->fresh()->remarks)->toHaveCount(1);
    expect($workJob->fresh()->remarks()->first()->action)->toBe(WorkJobStatus::Cancelled->value);
});

it('cannot cancel an in progress work job', function () {
    $workJob = WorkJob::factory()->inProgress()->create();

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/cancel")
        ->assertStatus(422);
});

it('marks confirmed work job as no show', function () {
    $workJob = WorkJob::factory()->create(['status' => WorkJobStatus::Confirmed]);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/no-show", [
            'remarks' => 'Customer was unavailable.',
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.status', WorkJobStatus::NoShow->value);

    expect($workJob->fresh()->status)->toBe(WorkJobStatus::NoShow);
});

it('reopens a cancelled work job', function () {
    $workJob = WorkJob::factory()->cancelled()->create();

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/reopen", [
            'remarks' => 'Incorrect cancellation.',
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.status', WorkJobStatus::Reopened->value);

    expect($workJob->fresh()->status)->toBe(WorkJobStatus::Reopened);
});

it('cannot cancel a completed work job', function () {
    $workJob = WorkJob::factory()->completed()->create();

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/work-jobs/{$workJob->id}/cancel")
        ->assertStatus(422);
});
