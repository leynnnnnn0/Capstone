<?php

namespace App\Http\Requests\Workers;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Carbon\Carbon;


class AvailableWorkersRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'appointment_date'       => ['required', 'date', 'after_or_equal:today'],
            'appointment_time_from'  => ['required', 'date_format:H:i'],
            'appointment_time_until' => ['required', 'date_format:H:i', 'after:appointment_time_from'],
            'appointment_id'         => ['nullable', 'integer', 'exists:appointments,id'],
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
            'appointment_id.exists'          => 'The specified appointment does not exist.',

        ];
    }
}
