<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkJobChargeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'charge_number' => $this->charge_number,
            'work_job_id' => $this->work_job_id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'amount' => (float) $this->amount,
            'payable_amount' => $this->payableAmount(),
            'currency' => $this->currency,
            'requires_customer_approval' => (bool) $this->requires_customer_approval,
            'approved_at' => $this->approved_at,
            'customer_approved_at' => $this->customer_approved_at,
            'created_at' => $this->created_at,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'approver' => new UserResource($this->whenLoaded('approver')),
        ];
    }
}
