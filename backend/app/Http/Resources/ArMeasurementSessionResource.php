<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArMeasurementSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'appointment_id' => $this->appointment_id,
            'customer_id' => $this->customer_id,
            'created_by' => $this->whenLoaded('creator', fn () => $this->userSummary($this->creator)),
            'source' => $this->source,
            'status' => $this->status?->value ?? $this->status,
            'status_label' => method_exists($this->status, 'label')
                ? $this->status->label()
                : $this->status,
            'capture_version' => $this->capture_version,
            'capture_mode' => $this->capture_mode,
            'overall_confidence' => $this->overall_confidence,
            'device_metadata' => $this->device_metadata,
            'captured_at' => $this->captured_at,
            'review_notes' => $this->review_notes,
            'reviewed_at' => $this->reviewed_at,
            'reviewed_by' => $this->whenLoaded('reviewer', fn () => $this->userSummary($this->reviewer)),
            'measurements_count' => $this->measurementCount(),
            'measurements' => ArMeasurementResource::collection(
                $this->whenLoaded('measurements')
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function measurementCount(): ?int
    {
        if (isset($this->measurements_count)) {
            return (int) $this->measurements_count;
        }

        return $this->relationLoaded('measurements')
            ? $this->measurements->count()
            : null;
    }

    private function userSummary($user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'role' => $user->role,
        ];
    }
}
