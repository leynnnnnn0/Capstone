<?php

namespace App\Enums;

enum ArMeasurementSessionStatus: string
{
    case Submitted = 'submitted';
    case Reviewed = 'reviewed';
    case Approved = 'approved';
    case NeedsRetake = 'needs_retake';

    public function label(): string
    {
        return match ($this) {
            self::Submitted => 'Submitted',
            self::Reviewed => 'Reviewed',
            self::Approved => 'Approved',
            self::NeedsRetake => 'Needs Retake',
        };
    }

    public function hasBeenReviewed(): bool
    {
        return $this !== self::Submitted;
    }
}
