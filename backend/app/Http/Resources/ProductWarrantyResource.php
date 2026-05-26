<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductWarrantyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'duration_months' => $this->duration_months,
            'is_active' => $this->is_active,
            'coverage' => $this->coverage,
            'terms' => $this->terms,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
