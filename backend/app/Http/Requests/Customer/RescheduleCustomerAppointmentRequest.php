<?php

namespace App\Http\Requests\Customer;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class RescheduleCustomerAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }

    public function rules(): array
    {
        return [
            'appointment_date'       => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'appointment_time_from'  => ['required', 'date_format:H:i'],
            'appointment_time_until' => ['required', 'date_format:H:i', 'after:appointment_time_from'],
            'reason'                 => ['required', 'string', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $date = $this->input('appointment_date');
            $timeFrom = $this->input('appointment_time_from');

            if (!$date || !$timeFrom) {
                return;
            }

            if (Carbon::parse("{$date} {$timeFrom}")->lte(now())) {
                $validator->errors()->add(
                    'appointment_time_from',
                    'The appointment time must be later than the current time.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'appointment_date.required' => 'Please provide the appointment date.',
            'appointment_date.after_or_equal' => 'Appointment date must be today or in the future.',
            'appointment_time_from.required' => 'Please provide the start time.',
            'appointment_time_until.after' => 'End time must be after the start time.',
            'reason.required' => 'Please provide a reschedule reason.',
        ];
    }
}
