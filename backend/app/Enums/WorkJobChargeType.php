<?php

namespace App\Enums;

enum WorkJobChargeType: string
{
    case ServiceFee = 'service_fee';
    case ExtraMaterial = 'extra_material';
    case ExtraLabor = 'extra_labor';
    case Delivery = 'delivery';
    case Adjustment = 'adjustment';
    case Discount = 'discount';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::ServiceFee => 'Service Fee',
            self::ExtraMaterial => 'Extra Material',
            self::ExtraLabor => 'Extra Labor',
            self::Delivery => 'Delivery',
            self::Adjustment => 'Adjustment',
            self::Discount => 'Discount',
            self::Other => 'Other',
        };
    }

    public function isDiscount(): bool
    {
        return $this === self::Discount;
    }
}
