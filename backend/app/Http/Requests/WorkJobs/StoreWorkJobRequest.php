<?php
// app/Http/Requests/WorkJobs/StoreWorkJobRequest.php

namespace App\Http\Requests\WorkJobs;

use App\Enums\FabricationStatus;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Throwable;

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

            // ── Fabrication ─────────────────────────────────────
            'fabrication_status' => [
                'sometimes',
                Rule::enum(FabricationStatus::class),
            ],
            'fabrication_expected_completion_date' => ['nullable', 'date', 'date_format:Y-m-d'],
            'fabrication_notes' => ['nullable', 'string', 'max:2000'],

            // ── Payment Terms ─────────────────────────────────
            'is_down_payment_required' => ['sometimes', 'boolean'],
            'down_payment_percentage' => ['nullable', 'numeric', 'min:1', 'max:100'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $date = $this->input('scheduled_date');
            $from = $this->input('scheduled_time_from');

            if (! is_string($date) || ! is_string($from)) {
                return;
            }

            try {
                $scheduledDate = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();
                $today = now()->startOfDay();

                if ($scheduledDate->lt($today)) {
                    $validator->errors()->add('scheduled_date', 'Work job date cannot be before today.');
                }

                $startAt = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$from}");

                if ($startAt->lte(now())) {
                    $validator->errors()->add('scheduled_time_from', 'Start time must be later than the current time.');
                }
            } catch (Throwable) {
                // Existing date/time rules handle malformed values.
            }

            $fabricationStatus = FabricationStatus::tryFrom(
                (string) $this->input('fabrication_status', FabricationStatus::NotRequired->value)
            );

            if ($fabricationStatus?->requiresExpectedCompletionDate() && ! $this->filled('fabrication_expected_completion_date')) {
                $validator->errors()->add(
                    'fabrication_expected_completion_date',
                    'Provide the customer with an expected fabrication completion date.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'first_name.required'           => 'First name is required.',
            'last_name.required'            => 'Last name is required.',
            'phone_number.required'         => 'Phone number is required.',
            'service_type.required'         => 'Service type is required.',
            'scheduled_date.required'       => 'Scheduled date is required.',
            'scheduled_date.date'           => 'Scheduled date must be a valid date.',
            'scheduled_date.date_format'    => 'Scheduled date must use the YYYY-MM-DD format.',
            'scheduled_time_from.required'  => 'Start time is required.',
            'scheduled_time_from.date_format' => 'Start time must be a valid time.',
            'scheduled_time_until.required' => 'End time is required.',
            'scheduled_time_until.date_format' => 'End time must be a valid time.',
            'scheduled_time_until.after'    => 'End time must be after the start time.',
            'worker_ids.required'           => 'Please assign at least one worker.',
            'worker_ids.min'                => 'Please assign at least one worker.',
            'worker_ids.*.exists'           => 'One or more selected workers do not exist.',
        ];
    }
}
