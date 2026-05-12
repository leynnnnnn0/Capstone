<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     * Sanitize and normalize inputs before rules run.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'first_name'   => $this->first_name   ? trim($this->first_name)   : $this->first_name,
            'last_name'    => $this->last_name     ? trim($this->last_name)    : $this->last_name,
            'email'        => $this->email         ? strtolower(trim($this->email)) : $this->email,
            'phone_number' => $this->phone_number  ? trim($this->phone_number) : $this->phone_number,
            'address'      => $this->address       ? trim($this->address)      : $this->address,
            'consent'      => filter_var($this->consent, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $this->consent,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // ── Identity ────────────────────────────────────────────────────
            'user_id'      => ['nullable', 'integer', 'exists:users,id'],

            // ── Personal Info ────────────────────────────────────────────────
            'first_name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[\pL\s\'\-\.]+$/u'],
            'last_name'  => ['required', 'string', 'min:2', 'max:100', 'regex:/^[\pL\s\'\-\.]+$/u'],
            'phone_number' => ['required', 'string', 'regex:/^\+?[0-9\s\-().]{7,20}$/'],
            'email'        => ['nullable', 'string', 'email:rfc,dns', 'max:255'],

            // ── Address ──────────────────────────────────────────────────────
            'address'        => ['required', 'string', 'min:5', 'max:500'],
            'address_pinned' => ['nullable', 'string', 'max:500'],

            // address_lat and address_lng must appear together or not at all
            'address_lat'    => ['nullable', 'numeric', 'between:-90,90',  'required_with:address_lng'],
            'address_lng'    => ['nullable', 'numeric', 'between:-180,180', 'required_with:address_lat'],

            // ── Scheduling Preference ────────────────────────────────────────
            'preferred_date' => [
                'required',
                'date',
                'date_format:Y-m-d',
                'after_or_equal:today',
            ],
            'preferred_time' => [
                'required',
                Rule::in(['morning', 'afternoon']),
            ],

            // ── Service ──────────────────────────────────────────────────────
            'service_type' => [
                'required',
                'string',
                Rule::in([
                    'quotation',
                    'installation',
                    'repair',
                    'maintenance',
                    'inspection',
                    'other',
                ]),
            ],
            // Required only when service_type is 'other'
            'service_type_other' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf(fn() => $this->input('service_type') === 'other'),
            ],

            // ── Additional Notes ─────────────────────────────────────────────
            'additional_notes' => ['nullable', 'string', 'max:2000'],

            // ── Appointment Scheduling (admin-set, nullable on creation) ─────
            'appointment_date'       => ['nullable', 'date', 'date_format:Y-m-d'],
            'appointment_time_from'  => [
                'nullable',
                'date_format:H:i',
                'required_with:appointment_date',
            ],
            'appointment_time_until' => [
                'nullable',
                'date_format:H:i',
                'required_with:appointment_time_from',
                'after:appointment_time_from',
            ],

            // ── Status ───────────────────────────────────────────────────────
            'status' => [
                'sometimes', // not required on creation; default set in model/migration
                Rule::in(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']),
            ],

            // ── Consent ──────────────────────────────────────────────────────
            'consent'          => ['required', 'boolean', 'accepted'],
            'consent_given_at' => ['nullable', 'date'],

            // ── Optional quotation items (customer pre-selection) ─
            'items'                                               => ['sometimes', 'array', 'min:1'],
            'items.*.product_id'                                  => ['required', 'integer', 'exists:products,id'],
            'items.*.name'                                        => ['required', 'string', 'max:255'],
            'items.*.description'                                 => ['nullable', 'string', 'max:500'],
            'items.*.width'                                       => ['nullable', 'numeric', 'min:0'],
            'items.*.height'                                      => ['nullable', 'numeric', 'min:0'],
            'items.*.thickness'                                   => ['nullable', 'numeric', 'min:0'],
            'items.*.pieces'                                      => ['required_with:items', 'integer', 'min:1'],
            'items.*.amount_per_piece'                            => ['required_with:items', 'numeric', 'min:0'],
            'items.*.options_amount'                              => ['nullable', 'numeric', 'min:0'],
            'items.*.total_amount'                                => ['required_with:items', 'numeric', 'min:0'],
            'items.*.notes'                                       => ['nullable', 'string', 'max:1000'],
            'items.*.selected_options'                            => ['nullable', 'array'],
            'items.*.selected_options.*.product_option_group_id' => ['required', 'integer', 'exists:product_option_groups,id'],
            'items.*.selected_options.*.product_option_id'       => ['required', 'integer', 'exists:product_options,id'],
            'items.*.selected_options.*.group_name'              => ['required', 'string'],
            'items.*.selected_options.*.option_name'             => ['required', 'string'],
            'items.*.selected_options.*.price_modifier'          => ['required', 'numeric'],
        ];
    }

    /**
     * Custom error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // Personal
            'first_name.required'   => 'Please provide your first name.',
            'first_name.min'        => 'First name must be at least 2 characters.',
            'last_name.required'    => 'Please provide your last name.',
            'last_name.min'         => 'Last name must be at least 2 characters.',
            'first_name.regex' => 'Please input a valid first name.',
            'last_name.regex'  => 'Please input a valid last name.',
            'phone_number.required' => 'A contact phone number is required.',
            'phone_number.regex'    => 'Please enter a valid phone number.',
            'email.email'           => 'Please enter a valid email address.',

            // Address
            'address.required'        => 'Please provide a service address.',
            'address_lat.required_with' => 'Latitude is required when longitude is provided.',
            'address_lng.required_with' => 'Longitude is required when latitude is provided.',
            'address_lat.between'     => 'Latitude must be between -90 and 90.',
            'address_lng.between'     => 'Longitude must be between -180 and 180.',

            // Scheduling
            'preferred_date.required'       => 'Please select your preferred appointment date.',
            'preferred_date.after_or_equal' => 'Preferred date must be today or in the future.',
            'preferred_time.required'       => 'Please select a preferred time slot (morning or afternoon).',
            'preferred_time.in'             => 'Preferred time must be either "morning" or "afternoon".',

            // Service
            'service_type.required'         => 'Please select a service type.',
            'service_type.in'               => 'The selected service type is not valid.',
            'service_type_other.required_if' => 'Please describe the service when selecting "Other".',

            // Appointment
            'appointment_time_from.required_with'  => 'A start time is required when an appointment date is set.',
            'appointment_time_until.required_with' => 'An end time is required when a start time is set.',
            'appointment_time_until.after'         => 'The end time must be after the start time.',

            // Consent
            'consent.required' => 'You must provide consent to proceed.',
            'consent.accepted' => 'You must accept the consent agreement to proceed.',
        ];
    }

    /**
     * Readable attribute names for error messages.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'user_id'                => 'user',
            'first_name'             => 'first name',
            'last_name'              => 'last name',
            'phone_number'           => 'phone number',
            'address_pinned'         => 'pinned address',
            'address_lat'            => 'latitude',
            'address_lng'            => 'longitude',
            'preferred_date'         => 'preferred date',
            'preferred_time'         => 'preferred time',
            'service_type'           => 'service type',
            'service_type_other'     => 'service description',
            'additional_notes'       => 'additional notes',
            'appointment_date'       => 'appointment date',
            'appointment_time_from'  => 'appointment start time',
            'appointment_time_until' => 'appointment end time',
            'consent_given_at'       => 'consent timestamp',
        ];
    }
}
