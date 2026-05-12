<?php

namespace App\Events;

use App\Models\Appointment;
use Illuminate\Foundation\Events\Dispatchable;

class AppointmentRescheduled
{
    use Dispatchable;

    public function __construct(
        public readonly Appointment $appointment
    ) {}
}
