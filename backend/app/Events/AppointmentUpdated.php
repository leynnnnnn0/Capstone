<?php

namespace App\Events;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Appointment $appointment,
        public readonly string $message,
        public readonly ?User $actor = null,
    ) {}
}
