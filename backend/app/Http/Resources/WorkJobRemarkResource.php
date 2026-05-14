<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkJobRemarkResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'message' => $this->message,
            'created_at' => $this->created_at,
            'user' => new WorkerResource($this->whenLoaded('user')),
        ];
    }
}
