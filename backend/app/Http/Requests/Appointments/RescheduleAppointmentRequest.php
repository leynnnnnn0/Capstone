<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Carbon\Carbon;

class RescheduleAppointmentRequest extends FormRequest
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
            'reason'                 => ['required', 'string', 'max:500'],
            'worker_ids'             => ['sometimes', 'array', 'min:1'],
            'worker_ids.*'           => ['integer', 'exists:users,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $date     = $this->input('appointment_date');
            $timeFrom = $this->input('appointment_time_from');

            if (!$date || !$timeFrom) return;

            if (Carbon::parse($date)->isToday()) {
                if (Carbon::parse($timeFrom)->lte(Carbon::now())) {
                    $validator->errors()->add(
                        'appointment_time_from',
                        'The appointment time must be later than the current time when booking for today.'
                    );
                }
            }
        });
    }
}
