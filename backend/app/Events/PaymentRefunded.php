<?php

namespace App\Events;

use App\Models\Payment;
use App\Models\PaymentRefund;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentRefunded
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Payment $payment,
        public readonly PaymentRefund $refund,
        public readonly WorkJob $workJob,
        public readonly string $message,
        public readonly ?User $actor = null,
    ) {}
}
