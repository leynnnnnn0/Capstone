<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case Pending     = 'pending';
    case Confirmed   = 'confirmed';
    case Rescheduled = 'rescheduled';
    case OnTheWay    = 'on_the_way';
    case InProgress  = 'in_progress';
    case Completed   = 'completed';
    case Cancelled   = 'cancelled';
    case NoShow      = 'no_show';

    public function label(): string
    {
        return match ($this) {
            self::Pending     => 'Pending',
            self::Confirmed   => 'Confirmed',
            self::Rescheduled => 'Rescheduled',
            self::OnTheWay    => 'On the Way',
            self::InProgress  => 'In Progress',
            self::Completed   => 'Completed',
            self::Cancelled   => 'Cancelled',
            self::NoShow      => 'No Show',
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Pending     => in_array($next, [self::Confirmed, self::Cancelled]),
            self::Confirmed   => in_array($next, [self::Rescheduled, self::OnTheWay, self::Cancelled]),
            self::Rescheduled => in_array($next, [self::Confirmed, self::Cancelled]),
            self::OnTheWay    => in_array($next, [self::InProgress, self::Cancelled]),
            self::InProgress  => in_array($next, [self::Completed]),
            self::Completed,
            self::Cancelled,
            self::NoShow => false
        };
    }
}
