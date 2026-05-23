<?php
// app/Http/Resources/WorkJobResource.php

namespace App\Http\Resources;

use App\Services\Payments\WorkJobPaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'work_job_number'      => $this->work_job_number,
            'user_id'              => $this->user_id,
            'appointment_id'       => $this->appointment_id,
            'quotation_id'         => $this->quotation_id,
            'parent_work_job_id'   => $this->parent_work_job_id,
            'is_back_job'          => $this->parent_work_job_id !== null,
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
            'back_job_reason'      => $this->back_job_reason?->value,
            'back_job_reason_label' => $this->back_job_reason?->label(),
            'back_job_reason_other' => $this->back_job_reason_other,
            'back_job_details'     => $this->back_job_details,
            'notes'                => $this->notes,
            'is_down_payment_required' => (bool) $this->is_down_payment_required,
            'down_payment_percentage' => (float) ($this->down_payment_percentage ?? 20),
            'payment_summary' => app(WorkJobPaymentService::class)->summary($this->resource),
            'created_at'           => $this->created_at,

            'workers' => WorkerResource::collection(
                $this->whenLoaded('workers')
            ),

            'appointment' => new AppointmentResource(
                $this->whenLoaded('appointment')
            ),

            'parent_work_job' => $this->whenLoaded(
                'parentWorkJob',
                fn () => $this->summaryWorkJob($this->parentWorkJob)
            ),

            'back_jobs' => $this->whenLoaded(
                'backJobs',
                fn () => $this->backJobs->map(fn ($workJob) => $this->summaryWorkJob($workJob))->values()
            ),

            'quotation' => new QuotationResource(
                $this->whenLoaded('quotation')
            ),

            'remarks' => WorkJobRemarkResource::collection(
                $this->whenLoaded('remarks')
            ),

            'payments' => PaymentResource::collection(
                $this->whenLoaded('payments')
            ),

            'charges' => WorkJobChargeResource::collection(
                $this->whenLoaded('charges')
            ),
        ];
    }

    private function summaryWorkJob($workJob): ?array
    {
        if (! $workJob) {
            return null;
        }

        return [
            'id'                   => $workJob->id,
            'work_job_number'      => $workJob->work_job_number,
            'status'               => $workJob->status?->value ?? $workJob->status,
            'status_label'         => method_exists($workJob->status, 'label') ? $workJob->status->label() : $workJob->status,
            'scheduled_date'       => $workJob->scheduled_date,
            'scheduled_time_from'  => $workJob->scheduled_time_from,
            'scheduled_time_until' => $workJob->scheduled_time_until,
            'full_name'            => trim("{$workJob->first_name} {$workJob->last_name}"),
            'back_job_reason'      => $workJob->back_job_reason?->value,
            'back_job_reason_label' => $workJob->back_job_reason?->label(),
            'back_job_details'     => $workJob->back_job_details,
        ];
    }
}
