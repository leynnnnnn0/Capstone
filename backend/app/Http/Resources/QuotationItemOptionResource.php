<?php
// app/Http/Resources/QuotationItemOptionResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuotationItemOptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'product_option_group_id' => $this->product_option_group_id,
            'product_option_id'      => $this->product_option_id,
            'group_name'             => $this->group_name,
            'option_name'            => $this->option_name,
            'price_modifier'         => $this->price_modifier,
        ];
    }
}
