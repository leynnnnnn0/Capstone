<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'description'    => $this->description,
            'unit'           => $this->unit,
            'price_per_unit' => $this->price_per_unit,
            'is_active'      => $this->is_active,
            'cover_image'    => $this->cover_image
                ? asset('storage/' . $this->cover_image)
                : null,

            'categories' => CategoryResource::collection(
                $this->whenLoaded('categories')
            ),

            'images' => ProductImageResource::collection(
                $this->whenLoaded('product_images')
            ),

            'variants' => ProductVariantResource::collection(
                $this->whenLoaded('product_variants')
            ),

            'option_groups' => ProductOptionGroupResource::collection(
                $this->whenLoaded('product_option_groups')
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
