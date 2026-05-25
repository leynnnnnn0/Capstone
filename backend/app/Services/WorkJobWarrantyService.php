<?php

namespace App\Services;

use App\Enums\WorkJobStatus;
use App\Enums\WorkJobWarrantyStatus;
use App\Models\User;
use App\Models\WorkJob;
use App\Models\WorkJobWarranty;

class WorkJobWarrantyService
{
    private const DEFAULT_DURATION_MONTHS = 12;

    public function issueForCompletedWorkJob(WorkJob $workJob, ?User $actor = null): ?WorkJobWarranty
    {
        if ($workJob->status !== WorkJobStatus::Completed || $workJob->parent_work_job_id !== null) {
            return null;
        }

        $existingWarranty = $workJob->warranty()->first();

        if ($existingWarranty) {
            return $existingWarranty->load('issuedBy');
        }

        $startsAt = now()->startOfDay();

        return WorkJobWarranty::create([
            'work_job_id' => $workJob->id,
            'user_id' => $workJob->user_id,
            'issued_by' => $actor?->id,
            'starts_at' => $startsAt->toDateString(),
            'expires_at' => $startsAt->copy()->addMonthsNoOverflow(self::DEFAULT_DURATION_MONTHS)->toDateString(),
            'duration_months' => self::DEFAULT_DURATION_MONTHS,
            'status' => WorkJobWarrantyStatus::Active,
            'coverage' => 'Covers workmanship concerns found after installation or service completion.',
            'terms' => 'Warranty claims are subject to SOG Glass & Aluminum inspection and do not cover misuse, accidental damage, or third-party alterations.',
        ])->load('issuedBy');
    }
}
