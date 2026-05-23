<?php

namespace App\Enums;

enum WorkJobBackJobReason: string
{
    case UnfinishedWork = 'unfinished_work';
    case WarrantyClaim = 'warranty_claim';
    case QualityIssue = 'quality_issue';
    case MissingParts = 'missing_parts';
    case CustomerRequest = 'customer_request';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::UnfinishedWork => 'Unfinished Work',
            self::WarrantyClaim => 'Warranty Claim',
            self::QualityIssue => 'Quality Issue',
            self::MissingParts => 'Missing Parts',
            self::CustomerRequest => 'Customer Request',
            self::Other => 'Other',
        };
    }
}
