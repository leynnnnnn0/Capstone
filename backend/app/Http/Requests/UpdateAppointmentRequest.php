<?php

namespace App\Http\Requests;

use App\Enums\AppointmentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $appointmentTimeFrom = $this->appointment_time_from ? trim($this->appointment_time_from) : $this->appointment_time_from;

        $this->merge([
            'first_name' => $this->first_name ? trim($this->first_name) : $this->first_name,
            'last_name' => $this->last_name ? trim($this->last_name) : $this->last_name,
            'email' => $this->email ? strtolower(trim($this->email)) : $this->email,
            'phone_number' => $this->phone_number ? trim($this->phone_number) : $this->phone_number,
            'address' => $this->address ? trim($this->address) : $this->address,
            'appointment_time_from' => $appointmentTimeFrom,
            'preferred_date' => $this->preferred_date ?: $this->appointment_date,
            'preferred_time' => $this->preferred_time ?: $this->preferredTimeFromAppointmentStart($appointmentTimeFrom),
        ]);
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'first_name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[\pL\s\'\-\.]+$/u'],
            'last_name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[\pL\s\'\-\.]+$/u'],
            'phone_number' => ['required', 'string', 'regex:/^\+?[0-9\s\-().]{7,20}$/'],
            'email' => ['nullable', 'string', 'email:rfc', 'max:255'],
            'address' => ['required', 'string', 'min:5', 'max:500'],
            'address_pinned' => ['nullable', 'string', 'max:500'],
            'address_lat' => ['nullable', 'numeric', 'between:-90,90', 'required_with:address_lng'],
            'address_lng' => ['nullable', 'numeric', 'between:-180,180', 'required_with:address_lat'],
            'preferred_date' => ['required', 'date', 'date_format:Y-m-d'],
            'preferred_time' => ['required', Rule::in(['morning', 'afternoon'])],
            'service_type' => ['required', Rule::in(['quotation', 'installation', 'repair', 'maintenance', 'inspection', 'other'])],
            'service_type_other' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf(fn () => $this->input('service_type') === 'other'),
            ],
            'additional_notes' => ['nullable', 'string', 'max:2000'],
            'appointment_date' => ['nullable', 'date', 'date_format:Y-m-d'],
            'appointment_time_from' => ['nullable', 'date_format:H:i', 'required_with:appointment_date'],
            'appointment_time_until' => ['nullable', 'date_format:H:i', 'required_with:appointment_time_from', 'after:appointment_time_from'],
            'status' => ['required', Rule::enum(AppointmentStatus::class)],
            'worker_ids' => ['nullable', 'array'],
            'worker_ids.*' => ['integer', 'exists:users,id'],
            'quotation_notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string', 'max:500'],
            'items.*.width' => ['nullable', 'numeric', 'min:0'],
            'items.*.height' => ['nullable', 'numeric', 'min:0'],
            'items.*.thickness' => ['nullable', 'numeric', 'min:0'],
            'items.*.pieces' => ['required_with:items', 'integer', 'min:1'],
            'items.*.amount_per_piece' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.options_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.total_amount' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
            'items.*.selected_options' => ['nullable', 'array'],
            'items.*.selected_options.*.product_option_group_id' => ['required', 'integer', 'exists:product_option_groups,id'],
            'items.*.selected_options.*.product_option_id' => ['required', 'integer', 'exists:product_options,id'],
            'items.*.selected_options.*.group_name' => ['required', 'string'],
            'items.*.selected_options.*.option_name' => ['required', 'string'],
            'items.*.selected_options.*.price_modifier' => ['required', 'numeric'],
        ];
    }

    private function preferredTimeFromAppointmentStart(?string $time): ?string
    {
        if (!$time) {
            return null;
        }

        $hour = (int) str($time)->before(':')->toString();

        return $hour < 12 ? 'morning' : 'afternoon';
    }
}
