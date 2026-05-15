<?php

namespace App\Events;

use App\Models\Quotation;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuotationSignatureInvalidated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Quotation $quotation,
        public readonly string $reason,
        public readonly ?User $actor = null,
    ) {}
}
