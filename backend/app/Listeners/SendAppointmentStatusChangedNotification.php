<?php

namespace App\Listeners;

use App\Events\AppointmentStatusChanged;
use App\Mail\Appointments\AppointmentStatusChangedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendAppointmentStatusChangedNotification implements ShouldQueue
{
    public function handle(AppointmentStatusChanged $event): void
    {
        if (!$event->appointment->email) {
            return;
        }

        Mail::to($event->appointment->email)
            ->queue(new AppointmentStatusChangedMail(
                $event->appointment,
                $event->status,
                $event->message,
            ));
    }
}
