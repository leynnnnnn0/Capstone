<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'appointment_number' => $this->appointment_number,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => trim("{$this->first_name} {$this->last_name}"),
            'phone_number' => $this->phone_number,
            'email' => $this->email,
            'address' => $this->address,
            'address_pinned' => $this->address_pinned,
            'address_lat' => $this->address_lat,
            'address_lng' => $this->address_lng,
            'preferred_date' => $this->preferred_date,
            'preferred_time' => $this->preferred_time,
            'service_type' => $this->service_type,
            'service_type_other' => $this->service_type_other,
            'additional_notes' => $this->additional_notes,
            'appointment_date' => $this->appointment_date,
            'appointment_time_from' => $this->appointment_time_from,
            'appointment_time_until' => $this->appointment_time_until,
            'status' => $this->status?->value ?? $this->status,
            'status_label' => method_exists($this->status, 'label') ? $this->status->label() : $this->status,
            'can_edit' => ($this->status?->value ?? $this->status) === 'pending',
            'can_cancel' => ! in_array(($this->status?->value ?? $this->status), ['cancelled', 'completed', 'no_show'], true),
            'consent' => $this->consent,
            'consent_given_at' => $this->consent_given_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'workers' => WorkerResource::collection($this->whenLoaded('workers')),
            'has_quotation' => $this->relationLoaded('quotation')
                ? $this->quotation !== null
                : $this->quotation()->exists(),
            'quotation' => new QuotationResource($this->whenLoaded('quotation')),
            'remarks' => AppointmentRemarkResource::collection($this->whenLoaded('remarks')),
            'work_job' => $this->whenLoaded('workJob', fn () => $this->workJob ? [
                'id' => $this->workJob->id,
                'work_job_number' => $this->workJob->work_job_number,
                'status' => $this->workJob->status?->value ?? $this->workJob->status,
                'status_label' => method_exists($this->workJob->status, 'label') ? $this->workJob->status->label() : $this->workJob->status,
                'scheduled_date' => $this->workJob->scheduled_date,
                'scheduled_time_from' => $this->workJob->scheduled_time_from,
                'scheduled_time_until' => $this->workJob->scheduled_time_until,
            ] : null),
        ];
    }
}
