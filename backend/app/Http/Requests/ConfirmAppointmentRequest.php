<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Carbon\Carbon;

class ConfirmAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'appointment_date'       => ['required', 'date', 'after_or_equal:today'],
            'appointment_time_from'  => ['required', 'date_format:H:i'],
            'appointment_time_until' => ['required', 'date_format:H:i', 'after:appointment_time_from'],
            'remarks'                => ['nullable', 'string', 'max:255'],
            'worker_ids'             => ['required', 'array', 'min:1'],
            'worker_ids.*'           => ['integer', 'exists:users,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {

            $date = $this->input('appointment_date');
            $timeFrom = $this->input('appointment_time_from');

            if (!$date || !$timeFrom) return;

            $isToday = Carbon::parse($date)->isToday();

            if ($isToday) {
                $now = Carbon::now();
                $selectedTime = Carbon::parse($timeFrom);

                if ($selectedTime->lte($now)) {
                    $validator->errors()->add(
                        'appointment_time_from',
                        'The appointment time must be later than the current time when booking for today.'
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'appointment_date.required'       => 'Please provide the appointment date.',
            'appointment_date.after_or_equal' => 'Appointment date must be today or in the future.',
            'appointment_time_from.required'  => 'Please provide the start time.',
            'appointment_time_until.after'    => 'End time must be after the start time.',
            'worker_ids.required'             => 'Please assign at least one worker.',
            'worker_ids.min'                  => 'Please assign at least one worker.',
            'worker_ids.*.exists'             => 'One or more selected workers do not exist.',
        ];
    }
}
