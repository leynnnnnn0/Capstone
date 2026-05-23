<?php
// app/Http/Requests/WorkJobs/StoreWorkJobRequest.php

namespace App\Http\Requests\WorkJobs;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreWorkJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // ── Origin ────────────────────────────────────────
            'user_id'        => ['nullable', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'quotation_id'   => ['nullable', 'integer', 'exists:quotations,id'],

            // ── Customer Info ─────────────────────────────────
            'first_name'   => ['required', 'string', 'max:255'],
            'last_name'    => ['required', 'string', 'max:255'],
            'phone_number' => ['required', 'string', 'max:20'],
            'email'        => ['nullable', 'email', 'max:255'],

            // ── Location ──────────────────────────────────────
            'address'        => ['nullable', 'string', 'max:500'],
            'address_pinned' => ['nullable', 'string', 'max:255'],
            'address_lat'    => ['nullable', 'numeric', 'between:-90,90'],
            'address_lng'    => ['nullable', 'numeric', 'between:-180,180'],

            // ── Service ───────────────────────────────────────
            'service_type'       => ['required', 'string', 'max:255'],
            'service_type_other' => ['nullable', 'string', 'max:255'],

            // ── Scheduling ────────────────────────────────────
            'scheduled_date'       => ['required', 'date', 'date_format:Y-m-d'],
            'scheduled_time_from'  => ['required', 'date_format:H:i'],
            'scheduled_time_until' => ['required', 'date_format:H:i', 'after:scheduled_time_from'],

            // ── Workers ───────────────────────────────────────
            'worker_ids'   => ['required', 'array', 'min:1'],
            'worker_ids.*' => ['integer', 'exists:users,id'],

            // ── Notes ─────────────────────────────────────────
            'notes' => ['nullable', 'string', 'max:2000'],

            // ── Payment Terms ─────────────────────────────────
            'is_down_payment_required' => ['sometimes', 'boolean'],
            'down_payment_percentage' => ['nullable', 'numeric', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required'           => 'First name is required.',
            'last_name.required'            => 'Last name is required.',
            'phone_number.required'         => 'Phone number is required.',
            'service_type.required'         => 'Service type is required.',
            'scheduled_date.required'       => 'Scheduled date is required.',
            'scheduled_time_from.required'  => 'Start time is required.',
            'scheduled_time_until.required' => 'End time is required.',
            'scheduled_time_until.after'    => 'End time must be after the start time.',
            'worker_ids.required'           => 'Please assign at least one worker.',
            'worker_ids.min'                => 'Please assign at least one worker.',
            'worker_ids.*.exists'           => 'One or more selected workers do not exist.',
        ];
    }
}
