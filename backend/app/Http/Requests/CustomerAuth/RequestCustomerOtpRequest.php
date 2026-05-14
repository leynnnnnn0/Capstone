<?php

namespace App\Http\Requests\CustomerAuth;

use Illuminate\Foundation\Http\FormRequest;

class RequestCustomerOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $contact = trim((string) $this->input('contact'));

        $this->merge([
            'contact' => str_contains($contact, '@')
                ? strtolower($contact)
                : preg_replace('/[\s().-]+/', '', $contact),
        ]);
    }

    public function rules(): array
    {
        return [
            'contact' => [
                'required',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (
                        ! filter_var($value, FILTER_VALIDATE_EMAIL)
                        && ! preg_match('/^\+?[0-9]{10,15}$/', (string) $value)
                    ) {
                        $fail('Enter a valid email address or mobile number.');
                    }
                },
            ],
        ];
    }
}
