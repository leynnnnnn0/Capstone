<?php

namespace App\Listeners;

use App\Events\AppointmentConfirmed;
use App\Mail\AppointmentConfirmedMail;
use App\Services\UniSmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendAppointmentConfirmedNotification implements ShouldQueue
{
    public function __construct(protected UniSmsService $sms) {}

    public function handle(AppointmentConfirmed $event): void
    {
        $appointment = $event->appointment;

        // Email
        if ($appointment->email) {
            Mail::to($appointment->email)
                ->queue(new AppointmentConfirmedMail($appointment));
        }

        // SMS 
        if ($appointment->phone_number) {
            $this->sms->send(
                $appointment->phone_number,
                "Hi {$appointment->first_name}, your appointment (Ref: {$appointment->appointment_number}) has been confirmed for {$appointment->appointment_date}, from {$appointment->appointment_time_from} to {$appointment->appointment_time_until}. Please contact us if you need to make any changes. Thank you!"
            );
        }
    }
}
