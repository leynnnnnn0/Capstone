<?php
// app/Http/Requests/Quotations/UpdateQuotationItemStatusRequest.php

namespace App\Http\Requests\Quotations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuotationItemStatusRequest extends FormRequest
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
                'string',
                Rule::in([
                    'for_acceptance',
                    'approved',
                    'rejected',
                    'revision_needed',
                    'on_hold',
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status is required.',
            'status.in'       => 'Invalid status value.',
        ];
    }
}
