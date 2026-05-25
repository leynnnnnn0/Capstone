<?php

namespace App\Http\Resources;

use App\Models\PaymentRefund;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentRefundResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var PaymentRefund $refund */
        $refund = $this->resource;

        return [
            'id' => $refund->id,
            'refund_number' => $refund->refund_number,
            'payment_id' => $refund->payment_id,
            'work_job_id' => $refund->work_job_id,
            'method' => $refund->method?->value,
            'method_label' => $refund->method?->label(),
            'status' => $refund->status,
            'status_label' => str($refund->status)->replace('_', ' ')->title()->toString(),
            'amount' => (float) $refund->amount,
            'currency' => $refund->currency,
            'provider' => $refund->provider,
            'provider_refund_id' => $refund->provider_refund_id,
            'provider_capture_id' => $refund->provider_capture_id,
            'reason' => $refund->reason,
            'refunded_at' => $refund->refunded_at,
            'created_at' => $refund->created_at,
            'creator' => new WorkerResource($this->whenLoaded('creator')),
        ];
    }
}
