<?php
// app/Http/Resources/QuotationItemResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuotationItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'product_id'       => $this->product_id,
            'name'             => $this->name,
            'description'      => $this->description,
            'width'            => $this->width,
            'height'           => $this->height,
            'thickness'        => $this->thickness,
            'pieces'           => $this->pieces,
            'amount_per_piece' => $this->amount_per_piece,
            'options_amount'   => $this->options_amount,
            'total_amount'     => $this->total_amount,
            'status'           => $this->status,
            'notes'            => $this->notes,

            'options' => QuotationItemOptionResource::collection(
                $this->whenLoaded('options')
            ),

            'before_images' => QuotationItemImageResource::collection(
                $this->whenLoaded('before_images')
            ),

            'after_images' => QuotationItemImageResource::collection(
                $this->whenLoaded('after_images')
            ),
        ];
    }
}
