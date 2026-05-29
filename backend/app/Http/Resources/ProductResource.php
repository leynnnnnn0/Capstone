<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
                ? Storage::disk('public')->url($this->cover_image)
                : null,

            'categories' => CategoryResource::collection(
                $this->whenLoaded('categories')
            ),

            'images' => ProductImageResource::collection(
                $this->whenLoaded('product_images')
            ),

            'model_3d' => $this->whenLoaded(
                'product_3d_model',
                fn() => $this->product_3d_model
                    ? new Product3DModelResource($this->product_3d_model)
                    : null
            ),

            'warranty' => $this->whenLoaded(
                'product_warranty',
                fn() => $this->product_warranty
                    ? new ProductWarrantyResource($this->product_warranty)
                    : null
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
