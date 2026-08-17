<?php

namespace App\Http\Requests\ArMeasurements;

use App\Enums\ArMeasurementSessionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewArMeasurementSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::enum(ArMeasurementSessionStatus::class)
                    ->only([
                        ArMeasurementSessionStatus::Reviewed,
                        ArMeasurementSessionStatus::Approved,
                        ArMeasurementSessionStatus::NeedsRetake,
                    ]),
            ],
            'review_notes' => [
                Rule::requiredIf(
                    $this->input('status') === ArMeasurementSessionStatus::NeedsRetake->value
                ),
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'review_notes.required' => 'Review notes are required when a retake is requested.',
        ];
    }
}
