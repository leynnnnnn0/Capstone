<?php

namespace App\Enums;

enum PaymentType: string
{
    case DownPayment = 'down_payment';
    case FinalPayment = 'final_payment';
    case FullPayment = 'full_payment';
    case AdditionalCharge = 'additional_charge';

    public function label(): string
    {
        return match ($this) {
            self::DownPayment => 'Down Payment',
            self::FinalPayment => 'Final Payment',
            self::FullPayment => 'Full Payment',
            self::AdditionalCharge => 'Additional Charge',
        };
    }
}
