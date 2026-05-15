<?php

namespace App\Events;

use App\Models\Quotation;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuotationChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Quotation $quotation,
        public readonly string $action,
        public readonly string $message,
        public readonly ?User $actor = null,
    ) {}
}
