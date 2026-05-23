<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case PayPal = 'paypal';
    case Cash = 'cash';
    case BankTransfer = 'bank_transfer';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::PayPal => 'PayPal',
            self::Cash => 'Cash',
            self::BankTransfer => 'Bank Transfer',
            self::Other => 'Other',
        };
    }
}
