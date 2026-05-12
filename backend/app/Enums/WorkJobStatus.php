<?php

namespace App\Enums;

enum WorkJobStatus: string
{
    case Pending    = 'pending';
    case InProgress = 'in_progress';
    case Completed  = 'completed';
    case Cancelled  = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending    => 'Pending',
            self::InProgress => 'In Progress',
            self::Completed  => 'Completed',
            self::Cancelled  => 'Cancelled',
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Pending    => in_array($next, [self::InProgress, self::Cancelled]),
            self::InProgress => in_array($next, [self::Completed, self::Cancelled]),
            self::Completed,
            self::Cancelled  => false,
        };
    }
}
