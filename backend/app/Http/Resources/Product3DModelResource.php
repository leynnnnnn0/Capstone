<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class Product3DModelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'file_path'        => $this->file_path,
            'file_url'         => route('api.v1.product-3d-models.file', $this->id),
            'original_name'    => $this->original_name,
            'file_size'        => $this->file_size,
            'mime_type'        => $this->mime_type,
            'is_default'       => $this->is_default,
            'material_targets' => $this->material_targets,
            'created_at'       => $this->created_at,
            'updated_at'       => $this->updated_at,
        ];
    }
}
