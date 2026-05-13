<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuotationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $items = $this->relationLoaded('quotation_items')
            ? $this->quotation_items
            : collect();

        $subtotal = $items->sum(fn($i) => floatval($i->total_amount));
        $discount = floatval($this->discount ?? 0);

        return [
            'id'             => $this->id,
            'appointment_id' => $this->appointment_id,
            'notes'          => $this->notes,
            'discount'       => $discount,
            'subtotal'       => $subtotal,
            'total'          => $subtotal - $discount,

            'appointment' => new AppointmentResource(
                $this->whenLoaded('appointment')
            ),

            'items' => QuotationItemResource::collection(
                $this->whenLoaded('quotation_items')
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
