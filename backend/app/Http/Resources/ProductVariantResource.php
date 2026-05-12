<?php
// app/Http/Resources/ProductVariantResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'width'     => $this->width,
            'height'    => $this->height,
            'price'     => $this->price,
            'is_active' => $this->is_active,
            'images'    => ProductImageResource::collection(
                $this->whenLoaded('product_variant_images')
            ),
        ];
    }
}
