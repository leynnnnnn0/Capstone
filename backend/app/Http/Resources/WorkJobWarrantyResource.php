<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkJobWarrantyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'warranty_number' => $this->warranty_number,
            'work_job_id' => $this->work_job_id,
            'user_id' => $this->user_id,
            'issued_by_id' => $this->issued_by,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'starts_at' => $this->starts_at?->toDateString(),
            'expires_at' => $this->expires_at?->toDateString(),
            'duration_months' => $this->duration_months,
            'coverage' => $this->coverage,
            'terms' => $this->terms,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'issued_by' => new WorkerResource(
                $this->whenLoaded('issuedBy')
            ),
        ];
    }
}
