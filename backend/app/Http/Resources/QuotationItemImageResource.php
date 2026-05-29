<?php
// app/Http/Resources/QuotationItemImageResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class QuotationItemImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'image_url' => Storage::disk('public')->url($this->image_path),
            'type'      => $this->type,
            'caption'   => $this->caption,
            'sort_order' => $this->sort_order,
        ];
    }
}
