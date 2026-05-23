<?php

namespace App\Http\Requests\WorkJobs;

use App\Enums\WorkJobBackJobReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBackJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'scheduled_date'       => ['required', 'date', 'date_format:Y-m-d'],
            'scheduled_time_from'  => ['required', 'date_format:H:i'],
            'scheduled_time_until' => ['required', 'date_format:H:i', 'after:scheduled_time_from'],
            'worker_ids'           => ['required', 'array', 'min:1'],
            'worker_ids.*'         => ['integer', 'exists:users,id'],
            'back_job_reason'      => ['required', Rule::enum(WorkJobBackJobReason::class)],
            'back_job_reason_other' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf($this->input('back_job_reason') === WorkJobBackJobReason::Other->value),
            ],
            'back_job_details' => ['required', 'string', 'max:2000'],
            'notes'            => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'scheduled_date.required'       => 'Scheduled date is required.',
            'scheduled_time_from.required'  => 'Start time is required.',
            'scheduled_time_until.required' => 'End time is required.',
            'scheduled_time_until.after'    => 'End time must be after the start time.',
            'worker_ids.required'           => 'Please assign at least one worker.',
            'worker_ids.min'                => 'Please assign at least one worker.',
            'worker_ids.*.exists'           => 'One or more selected workers do not exist.',
            'back_job_reason.required'      => 'Please select why a back job is needed.',
            'back_job_details.required'     => 'Please add the details for this back job.',
            'back_job_reason_other.required' => 'Please describe the back job reason.',
        ];
    }
}
