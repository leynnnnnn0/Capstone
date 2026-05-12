<?php

namespace App\Listeners;

use App\Events\AppointmentRescheduled;
use App\Mail\Appointments\AppointmentRescheduledMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendAppointmentRescheduledNotification implements ShouldQueue
{

    public function handle(AppointmentRescheduled $event): void
    {
        $appointment = $event->appointment;

        if($appointment->email){
            Mail::to($appointment->email)
            ->queue(new AppointmentRescheduledMail($appointment));
        }
    }
}
