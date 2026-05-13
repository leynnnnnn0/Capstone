<?php

namespace App\Services\Tracking;

use App\Models\Appointment;
use App\Models\WorkJob;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class TrackingService
{
    public function find(string $reference): array
    {
        $reference = strtoupper(trim($reference));

        if (str_starts_with($reference, 'WJ-')) {
            return $this->workJobResult($reference);
        }

        return $this->appointmentResult($reference);
    }

    private function appointmentResult(string $reference): array
    {
        $appointment = Appointment::query()
            ->where('appointment_number', $reference)
            ->with([
                'workers',
                'remarks',
                'remarks.appointment',
                'quotation.quotation_items.options',
            ])
            ->first();

        if (!$appointment) {
            throw new ModelNotFoundException('Tracking reference was not found.');
        }

        $quotation = $appointment->quotation;
        $items = $quotation?->quotation_items ?? collect();

        return [
            'type' => 'appointment',
            'reference_number' => $appointment->appointment_number,
            'first_name' => $appointment->first_name,
            'full_name' => "{$appointment->first_name} {$appointment->last_name}",
            'phone_number' => $appointment->phone_number,
            'email' => $appointment->email,
            'address' => $appointment->address,
            'status' => $appointment->status->value,
            'preferred_date' => $appointment->preferred_date,
            'preferred_time' => $appointment->preferred_time,
            'appointment_date' => $appointment->appointment_date,
            'appointment_time_from' => $appointment->appointment_time_from,
            'appointment_time_until' => $appointment->appointment_time_until,
            'service_type' => $appointment->service_type,
            'additional_notes' => $appointment->additional_notes,
            'has_quotation' => $quotation !== null,
            'items' => $this->items($items),
            'grand_total' => $this->grandTotal($quotation),
            'discount' => (float) ($quotation->discount ?? 0),
            'quotation_notes' => $quotation?->notes,
            'workers' => $appointment->workers->pluck('full_name')->values(),
            'remarks' => $appointment->remarks
                ->sortByDesc('created_at')
                ->map(fn($remark) => [
                    'action' => $remark->action,
                    'message' => $remark->message,
                    'by' => $remark->user_id ? 'SOG Team' : 'System',
                    'created_at' => $remark->created_at?->toDateTimeString(),
                ])
                ->values(),
        ];
    }

    private function workJobResult(string $reference): array
    {
        $workJob = WorkJob::query()
            ->where('work_job_number', $reference)
            ->with(['workers', 'quotation.quotation_items.options'])
            ->first();

        if (!$workJob) {
            throw new ModelNotFoundException('Tracking reference was not found.');
        }

        $quotation = $workJob->quotation;
        $items = $quotation?->quotation_items ?? collect();

        return [
            'type' => 'work_job',
            'reference_number' => $workJob->work_job_number,
            'first_name' => $workJob->first_name,
            'full_name' => $workJob->full_name,
            'phone_number' => $workJob->phone_number,
            'email' => $workJob->email,
            'address' => $workJob->address,
            'status' => $workJob->status->value,
            'scheduled_date' => $workJob->scheduled_date,
            'scheduled_time_from' => $workJob->scheduled_time_from,
            'scheduled_time_until' => $workJob->scheduled_time_until,
            'service_type' => $workJob->service_type,
            'notes' => $workJob->notes,
            'has_quotation' => $quotation !== null,
            'items' => $this->items($items),
            'grand_total' => $this->grandTotal($quotation),
            'discount' => (float) ($quotation->discount ?? 0),
            'quotation_notes' => $quotation?->notes,
            'workers' => $workJob->workers->pluck('full_name')->values(),
            'remarks' => [],
        ];
    }

    private function items($items): array
    {
        return $items
            ->map(fn($item) => [
                'name' => $item->name,
                'size' => $this->size($item),
                'options' => $item->options->pluck('option_name')->values(),
                'pieces' => $item->pieces,
                'total_amount' => (float) $item->total_amount,
                'status' => $item->status,
            ])
            ->values()
            ->all();
    }

    private function size($item): ?string
    {
        if ($item->width && $item->height) {
            return "{$item->width} x {$item->height}";
        }

        if ($item->width) {
            return (string) $item->width;
        }

        return null;
    }

    private function grandTotal($quotation): float
    {
        if (!$quotation) return 0;

        $subtotal = $quotation->quotation_items->sum(fn($item) => (float) $item->total_amount);
        return max(0, $subtotal - (float) ($quotation->discount ?? 0));
    }
}
