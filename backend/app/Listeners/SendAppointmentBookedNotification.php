<?php

namespace App\Listeners;

use App\Events\AppointmentBooked;
use App\Mail\Appointments\AppointmentBookedMail;
use App\Models\Appointment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendAppointmentBookedNotification implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(AppointmentBooked $event): void
    {
        $appointment = $event->appointment;

        if($appointment->email){
            Mail::to($appointment->email)
            ->queue(new AppointmentBookedMail($appointment));
        }
    }
}
   