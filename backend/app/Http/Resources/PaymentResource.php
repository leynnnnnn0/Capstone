<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_number' => $this->payment_number,
            'work_job_id' => $this->work_job_id,
            'quotation_id' => $this->quotation_id,
            'type' => $this->type?->value,
            'type_label' => $this->type?->label(),
            'method' => $this->method?->value,
            'method_label' => $this->method?->label(),
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'provider' => $this->provider,
            'provider_order_id' => $this->provider_order_id,
            'provider_capture_id' => $this->provider_capture_id,
            'provider_payer_email' => $this->provider_payer_email,
            'paid_at' => $this->paid_at,
            'remarks' => $this->remarks,
            'created_at' => $this->created_at,

            'work_job' => $this->whenLoaded('workJob', fn () => [
                'id' => $this->workJob->id,
                'work_job_number' => $this->workJob->work_job_number,
                'full_name' => $this->workJob->full_name,
                'phone_number' => $this->workJob->phone_number,
                'email' => $this->workJob->email,
                'status' => $this->workJob->status?->value,
                'status_label' => $this->workJob->status?->label(),
                'scheduled_date' => $this->workJob->scheduled_date,
                'scheduled_time_from' => $this->workJob->scheduled_time_from,
                'scheduled_time_until' => $this->workJob->scheduled_time_until,
                'workers' => WorkerResource::collection($this->workJob->workers),
            ]),

            'quotation' => $this->whenLoaded('quotation', fn () => [
                'id' => $this->quotation->id,
                'total' => (float) $this->quotation->total,
            ]),

            'payer' => new WorkerResource(
                $this->whenLoaded('payer')
            ),

            'creator' => new WorkerResource(
                $this->whenLoaded('creator')
            ),
        ];
    }
}
