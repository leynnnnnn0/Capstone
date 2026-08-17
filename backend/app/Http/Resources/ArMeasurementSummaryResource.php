<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArMeasurementSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $measurements = $this->measurements;
        $confidenceDistribution = collect(['none', 'weak', 'medium', 'high'])
            ->mapWithKeys(fn (string $confidence) => [
                $confidence => $measurements
                    ->where('confidence', $confidence)
                    ->count(),
            ])
            ->all();

        $totalArea = $measurements->sum(
            fn ($measurement) => ($measurement->width_cm * $measurement->height_cm) / 10_000
        );
        $totalLinear = $measurements->sum(
            fn ($measurement) => $measurement->width_cm / 100
        );

        return [
            'reference' => $this->reference,
            'status' => $this->status?->value ?? $this->status,
            'status_label' => method_exists($this->status, 'label')
                ? $this->status->label()
                : $this->status,
            'appointment' => [
                'id' => $this->appointment->id,
                'appointment_number' => $this->appointment->appointment_number,
                'customer_name' => trim(
                    "{$this->appointment->first_name} {$this->appointment->last_name}"
                ),
                'service_type' => $this->appointment->service_type,
                'address' => $this->appointment->address,
            ],
            'capture' => [
                'capture_version' => $this->capture_version,
                'capture_mode' => $this->capture_mode,
                'overall_confidence' => $this->overall_confidence,
                'device_metadata' => $this->device_metadata,
                'captured_at' => $this->captured_at,
                'source' => $this->source,
                'created_by' => $this->userSummary($this->creator),
            ],
            'review' => [
                'review_notes' => $this->review_notes,
                'reviewed_at' => $this->reviewed_at,
                'reviewed_by' => $this->userSummary($this->reviewer),
            ],
            'object_count' => $measurements->count(),
            'totals' => [
                'total_linear_m' => round($totalLinear, 4),
                'total_area_sqm' => round($totalArea, 4),
            ],
            'confidence_distribution' => $confidenceDistribution,
            'by_type' => $measurements
                ->groupBy('object_type')
                ->map(function ($objects, string $objectType) {
                    return [
                        'object_type' => $objectType,
                        'count' => $objects->count(),
                        'total_linear_m' => round(
                            $objects->sum(fn ($object) => $object->width_cm / 100),
                            4
                        ),
                        'total_area_sqm' => round(
                            $objects->sum(
                                fn ($object) => ($object->width_cm * $object->height_cm) / 10_000
                            ),
                            4
                        ),
                    ];
                })
                ->values(),
            'measurements' => ArMeasurementResource::collection($measurements),
        ];
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
