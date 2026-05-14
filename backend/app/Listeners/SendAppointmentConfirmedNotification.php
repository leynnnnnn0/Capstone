<?php

namespace App\Listeners;

use App\Events\AppointmentConfirmed;
use App\Mail\AppointmentConfirmedMail;
use App\Services\UniSmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendAppointmentConfirmedNotification implements ShouldQueue
{
    public function __construct(protected UniSmsService $sms) {}

    public function handle(AppointmentConfirmed $event): void
    {
        $appointment = $event->appointment;

        try {
            if ($appointment->email) {
                Mail::to($appointment->email)
                    ->queue(new AppointmentConfirmedMail($appointment));
            }
        } catch (Throwable $e) {
            Log::warning('Failed to queue appointment confirmation email.', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }

        try {
            if ($appointment->phone_number) {
                $this->sms->send(
                    $appointment->phone_number,
                    "Hi {$appointment->first_name}, your appointment (Ref: {$appointment->appointment_number}) has been confirmed for {$appointment->appointment_date}, from {$appointment->appointment_time_from} to {$appointment->appointment_time_until}. Please contact us if you need to make any changes. Thank you!"
                );
            }
        } catch (Throwable $e) {
            Log::warning('Failed to send appointment confirmation SMS.', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
