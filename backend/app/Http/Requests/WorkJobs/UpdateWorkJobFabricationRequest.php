<?php

namespace App\Http\Requests\WorkJobs;

use App\Enums\FabricationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateWorkJobFabricationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(FabricationStatus::class)],
            'expected_completion_date' => ['nullable', 'date', 'date_format:Y-m-d'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $status = FabricationStatus::tryFrom((string) $this->input('status'));

            if ($status?->requiresExpectedCompletionDate() && ! $this->filled('expected_completion_date')) {
                $validator->errors()->add(
                    'expected_completion_date',
                    'Provide the customer with an expected fabrication completion date.'
                );
            }

            if ($status === FabricationStatus::OnHold && ! filled($this->input('notes'))) {
                $validator->errors()->add('notes', 'Explain why fabrication is on hold.');
            }
        });
    }
}
