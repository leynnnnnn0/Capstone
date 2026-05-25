<?php

namespace App\Services;

use App\Enums\WorkJobChargeStatus;
use App\Enums\WorkJobChargeType;
use App\Events\WorkJobChanged;
use App\Models\User;
use App\Models\WorkJob;
use App\Models\WorkJobCharge;
use Illuminate\Support\Facades\DB;

class WorkJobChargeService
{
    public function create(WorkJob $workJob, array $data, User $actor): WorkJob
    {
        $status = WorkJobChargeStatus::from($data['status'] ?? WorkJobChargeStatus::Approved->value);
        $type = WorkJobChargeType::from($data['type'] ?? WorkJobChargeType::ServiceFee->value);

        DB::transaction(function () use ($workJob, $data, $actor, $status, $type) {
            $charge = $workJob->charges()->create([
                'created_by' => $actor->id,
                'approved_by' => $status === WorkJobChargeStatus::Approved ? $actor->id : null,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'type' => $type,
                'status' => $status,
                'amount' => round((float) $data['amount'], 2),
                'currency' => config('paypal.currency', 'PHP'),
                'requires_customer_approval' => (bool) ($data['requires_customer_approval'] ?? true),
                'approved_at' => $status === WorkJobChargeStatus::Approved ? now() : null,
            ]);

            $workJob->remarks()->create([
                'user_id' => $actor->id,
                'action' => 'charge_created',
                'message' => $this->chargeMessage('added', $charge),
            ]);
        });

        $workJob = $workJob->fresh()->load($this->relations());

        WorkJobChanged::dispatch(
            $workJob,
            'charge_created',
            'A work job charge was added.',
            $actor
        );

        return $workJob;
    }

    public function update(WorkJobCharge $charge, array $data, User $actor): WorkJob
    {
        DB::transaction(function () use ($charge, $data, $actor) {
            $status = WorkJobChargeStatus::from($data['status'] ?? $charge->status->value);
            $type = WorkJobChargeType::from($data['type'] ?? $charge->type->value);
            $wasApproved = $charge->status === WorkJobChargeStatus::Approved;
            $isApproved = $status === WorkJobChargeStatus::Approved;

            $charge->update([
                'approved_by' => $isApproved ? ($charge->approved_by ?: $actor->id) : null,
                'title' => $data['title'] ?? $charge->title,
                'description' => array_key_exists('description', $data) ? $data['description'] : $charge->description,
                'type' => $type,
                'status' => $status,
                'amount' => array_key_exists('amount', $data) ? round((float) $data['amount'], 2) : $charge->amount,
                'requires_customer_approval' => array_key_exists('requires_customer_approval', $data)
                    ? (bool) $data['requires_customer_approval']
                    : $charge->requires_customer_approval,
                'approved_at' => $isApproved ? ($wasApproved ? $charge->approved_at : now()) : null,
            ]);

            $charge->workJob->remarks()->create([
                'user_id' => $actor->id,
                'action' => 'charge_updated',
                'message' => $this->chargeMessage('updated', $charge->fresh()),
            ]);
        });

        $workJob = $charge->workJob->fresh()->load($this->relations());

        WorkJobChanged::dispatch(
            $workJob,
            'charge_updated',
            'A work job charge was updated.',
            $actor
        );

        return $workJob;
    }

    public function cancel(WorkJobCharge $charge, ?string $remarks, User $actor): WorkJob
    {
        DB::transaction(function () use ($charge, $remarks, $actor) {
            $charge->update([
                'status' => WorkJobChargeStatus::Cancelled,
                'approved_by' => null,
                'approved_at' => null,
            ]);

            $charge->workJob->remarks()->create([
                'user_id' => $actor->id,
                'action' => 'charge_cancelled',
                'message' => $remarks ?: $this->chargeMessage('cancelled', $charge->fresh()),
            ]);
        });

        $workJob = $charge->workJob->fresh()->load($this->relations());

        WorkJobChanged::dispatch(
            $workJob,
            'charge_cancelled',
            'A work job charge was cancelled.',
            $actor
        );

        return $workJob;
    }

    private function chargeMessage(string $verb, WorkJobCharge $charge): string
    {
        $amount = number_format((float) $charge->amount, 2);

        return "{$charge->type->label()} {$verb}: {$charge->title} ({$charge->currency} {$amount}).";
    }

    private function relations(): array
    {
        return [
            'workers',
            'appointment.workJob',
            'quotation.quotation_items.options',
            'quotation.quotation_items.product.product_images',
            'quotation.quotation_items.before_images',
            'quotation.quotation_items.after_images',
            'payments.payer',
            'payments.creator',
            'charges.creator',
            'charges.approver',
            'warranty.issuedBy',
            'remarks.user',
        ];
    }
}
