<?php

namespace App\Listeners;

use App\Events\AppointmentCancelled;
use App\Mail\Appointments\AppointmentCancelledMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendAppointmentCancelledNotification
{
    /**
     * Handle the event.
     */
    public function handle(AppointmentCancelled $event): void
    {
        $appointment = $event->appointment;

        if($appointment->email){
            Mail::to($appointment->email)
            ->queue(new AppointmentCancelledMail($appointment));
        }

    }
}
