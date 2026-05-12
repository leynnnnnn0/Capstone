<?php
// app/Http/Resources/WorkJobResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'work_job_number'      => $this->work_job_number,
            'appointment_id'       => $this->appointment_id,
            'quotation_id'         => $this->quotation_id,
            'first_name'           => $this->first_name,
            'last_name'            => $this->last_name,
            'full_name'            => $this->full_name,
            'phone_number'         => $this->phone_number,
            'email'                => $this->email,
            'address'              => $this->address,
            'address_pinned'       => $this->address_pinned,
            'address_lat'          => $this->address_lat,
            'address_lng'          => $this->address_lng,
            'service_type'         => $this->service_type,
            'service_type_other'   => $this->service_type_other,
            'scheduled_date'       => $this->scheduled_date,
            'scheduled_time_from'  => $this->scheduled_time_from,
            'scheduled_time_until' => $this->scheduled_time_until,
            'status'               => $this->status->value,
            'status_label'         => $this->status->label(),
            'notes'                => $this->notes,
            'created_at'           => $this->created_at,

            'workers' => WorkerResource::collection(
                $this->whenLoaded('workers')
            ),

            'appointment' => new AppointmentResource(
                $this->whenLoaded('appointment')
            ),

            'quotation' => new QuotationResource(
                $this->whenLoaded('quotation')
            ),
        ];
    }
}
