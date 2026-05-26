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
    private const DEFAULT_COVERAGE = 'Covers workmanship concerns found after installation or service completion.';
    private const DEFAULT_TERMS = 'Warranty claims are subject to SOG Glass & Aluminum inspection and do not cover misuse, accidental damage, or third-party alterations.';

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
        $warrantyDefaults = $this->resolveWarrantyDefaults($workJob);

        return WorkJobWarranty::create([
            'work_job_id' => $workJob->id,
            'user_id' => $workJob->user_id,
            'issued_by' => $actor?->id,
            'starts_at' => $startsAt->toDateString(),
            'expires_at' => $startsAt->copy()->addMonthsNoOverflow($warrantyDefaults['duration_months'])->toDateString(),
            'duration_months' => $warrantyDefaults['duration_months'],
            'status' => WorkJobWarrantyStatus::Active,
            'coverage' => $warrantyDefaults['coverage'],
            'terms' => $warrantyDefaults['terms'],
        ])->load('issuedBy');
    }

    private function resolveWarrantyDefaults(WorkJob $workJob): array
    {
        $quotation = $workJob->quotation()
            ->with('quotation_items.product.product_warranty')
            ->first();

        $warranties = collect($quotation?->quotation_items ?? [])
            ->map(fn ($item) => $item->product?->product_warranty)
            ->filter(fn ($warranty) => $warranty && $warranty->is_active)
            ->values();

        if ($warranties->isEmpty()) {
            return [
                'duration_months' => self::DEFAULT_DURATION_MONTHS,
                'coverage' => self::DEFAULT_COVERAGE,
                'terms' => self::DEFAULT_TERMS,
            ];
        }

        return [
            'duration_months' => (int) $warranties->max('duration_months'),
            'coverage' => $warranties->first(fn ($warranty) => filled($warranty->coverage))?->coverage ?? self::DEFAULT_COVERAGE,
            'terms' => $warranties->first(fn ($warranty) => filled($warranty->terms))?->terms ?? self::DEFAULT_TERMS,
        ];
    }
}
