<?php
// app/Http/Resources/ProductOptionGroupResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductOptionGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'is_required' => $this->is_required,
            'sort_order'  => $this->sort_order,
            'options'     => ProductOptionResource::collection(
                $this->whenLoaded('product_options')
            ),
        ];
    }
}
