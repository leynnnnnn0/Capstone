<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkJobRatingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'work_job_id' => $this->work_job_id,
            'user_id' => $this->user_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'submitted_at' => $this->submitted_at,
            'created_at' => $this->created_at,
            'customer' => new WorkerResource($this->whenLoaded('customer')),
        ];
    }
}
