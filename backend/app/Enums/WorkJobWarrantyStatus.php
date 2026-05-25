<?php

namespace App\Enums;

enum WorkJobWarrantyStatus: string
{
    case Active = 'active';
    case Expired = 'expired';
    case Voided = 'voided';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Expired => 'Expired',
            self::Voided => 'Voided',
        };
    }
}
