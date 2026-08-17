<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArMeasurementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'object_type' => $this->object_type,
            'model_id' => $this->model_id,
            'label' => $this->label,
            'segments_cm' => array_map(
                static fn ($segment) => (float) $segment,
                $this->segments_cm ?? []
            ),
            'width_cm' => (float) $this->width_cm,
            'height_cm' => (float) $this->height_cm,
            'depth_cm' => $this->depth_cm === null ? null : (float) $this->depth_cm,
            'unit' => 'cm',
            'confidence' => $this->confidence,
            'points_count' => $this->points_count,
            'metadata' => $this->metadata,
            'area_sqm' => $this->areaSquareMeters(),
        ];
    }
}
