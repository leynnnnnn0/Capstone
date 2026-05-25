<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;

class PaymentReconciliationService
{
    public function cancelStalePendingPayPalPayments(int $staleMinutes = 60): int
    {
        $cutoff = now()->subMinutes(max($staleMinutes, 1));
        $count = 0;

        Payment::query()
            ->where('status', PaymentStatus::Pending->value)
            ->where('method', PaymentMethod::PayPal->value)
            ->where('created_at', '<=', $cutoff)
            ->chunkById(100, function ($payments) use (&$count) {
                /** @var Payment $payment */
                foreach ($payments as $payment) {
                    $metadata = $payment->metadata ?? [];

                    $payment->update([
                        'status' => PaymentStatus::Cancelled,
                        'remarks' => trim(($payment->remarks ? "{$payment->remarks}\n" : '') . 'Payment checkout expired before capture.'),
                        'metadata' => [
                            ...$metadata,
                            'cancelled_reason' => 'stale_paypal_checkout',
                            'cancelled_at' => now()->toISOString(),
                        ],
                    ]);

                    $count++;
                }
            });

        return $count;
    }
}
