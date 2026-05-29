<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            'signature_status' => $this->signatureStatus(),
            'customer_signed_at' => $this->customer_signed_at,
            'customer_signature_name' => $this->customer_signature_name,
            'customer_signature_url' => $this->customer_signature_path
                ? Storage::disk('public')->url($this->customer_signature_path)
                : null,
            'signature_invalidated_at' => $this->signature_invalidated_at,
            'signature_invalidated_reason' => $this->signature_invalidated_reason,

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
