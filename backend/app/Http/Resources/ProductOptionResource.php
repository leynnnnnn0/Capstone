<?php
// app/Http/Resources/ProductOptionResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductOptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'price_modifier' => $this->price_modifier,
            'sort_order'     => $this->sort_order,
            'is_active'      => $this->is_active,
        ];
    }
}
