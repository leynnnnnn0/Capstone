<?php

namespace App\Enums;

enum WorkJobChargeStatus: string
{
    case PendingApproval = 'pending_approval';
    case Approved = 'approved';
    case Waived = 'waived';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::PendingApproval => 'Pending Approval',
            self::Approved => 'Approved',
            self::Waived => 'Waived',
            self::Cancelled => 'Cancelled',
        };
    }

    public function isPayable(): bool
    {
        return $this === self::Approved;
    }
}
