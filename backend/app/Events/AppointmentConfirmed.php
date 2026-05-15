<?php

namespace App\Events;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;

class AppointmentConfirmed
{
    use Dispatchable;

    public function __construct(
        public readonly Appointment $appointment,
        public readonly ?User $actor = null,
    ) {}
}
