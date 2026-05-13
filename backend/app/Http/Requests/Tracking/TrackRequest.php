<?php

namespace App\Http\Requests\Tracking;

use Illuminate\Foundation\Http\FormRequest;

class TrackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'reference' => $this->reference ? strtoupper(trim($this->reference)) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'reference' => ['required', 'string', 'max:50'],
        ];
    }
}
