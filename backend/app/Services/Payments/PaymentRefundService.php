<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Events\PaymentRefunded;
use App\Models\Payment;
use App\Models\PaymentRefund;
use App\Models\User;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class PaymentRefundService
{
    public function __construct(private readonly PayPalClient $paypal) {}

    /**
     * @throws Throwable
     */
    public function refund(Payment $payment, array $data, User $actor): Payment
    {
        $method = isset($data['method'])
            ? PaymentMethod::from($data['method'])
            : $payment->method;

        $amount = round((float) $data['amount'], 2);
        $reason = trim((string) ($data['reason'] ?? ''));

        $refund = DB::transaction(function () use ($payment, $method, $amount, $reason, $actor) {
            /** @var Payment $lockedPayment */
            $lockedPayment = Payment::query()
                ->with(['refunds', 'workJob'])
                ->lockForUpdate()
                ->findOrFail($payment->id);

            $this->ensureRefundable($lockedPayment, $method, $amount);

            return $lockedPayment->refunds()->create([
                'work_job_id' => $lockedPayment->work_job_id,
                'created_by' => $actor->id,
                'method' => $method->value,
                'status' => PaymentRefund::STATUS_PENDING,
                'amount' => $amount,
                'currency' => $lockedPayment->currency,
                'provider' => $method === PaymentMethod::PayPal ? 'paypal' : null,
                'provider_capture_id' => $method === PaymentMethod::PayPal ? $lockedPayment->provider_capture_id : null,
                'reason' => $reason,
            ]);
        });

        if ($method === PaymentMethod::PayPal) {
            try {
                $providerRefund = $this->paypal->refundCapture($payment->fresh(['workJob']), $refund);
            } catch (RequestException $exception) {
                $refund->update([
                    'status' => PaymentRefund::STATUS_FAILED,
                    'metadata' => [
                        'error' => $exception->getMessage(),
                        'response' => $exception->response?->json(),
                    ],
                ]);

                throw ValidationException::withMessages([
                    'method' => $this->paypalRefundFailureMessage($exception),
                ]);
            }

            return DB::transaction(function () use ($payment, $refund, $providerRefund, $actor) {
                $refund->update([
                    'status' => PaymentRefund::STATUS_COMPLETED,
                    'provider_refund_id' => data_get($providerRefund, 'id'),
                    'refunded_at' => now(),
                    'metadata' => $providerRefund,
                ]);

                return $this->finalizeRefund($payment->fresh(['refunds', 'workJob']), $refund->fresh(), $actor);
            });
        }

        return DB::transaction(function () use ($payment, $refund, $actor) {
            $refund->update([
                'status' => PaymentRefund::STATUS_COMPLETED,
                'refunded_at' => now(),
            ]);

            return $this->finalizeRefund($payment->fresh(['refunds', 'workJob']), $refund->fresh(), $actor);
        });
    }

    private function ensureRefundable(Payment $payment, PaymentMethod $method, float $amount): void
    {
        if (! $payment->capturedForRevenue()) {
            throw ValidationException::withMessages([
                'payment' => 'Only paid payments can be refunded.',
            ]);
        }

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Refund amount must be greater than zero.',
            ]);
        }

        if ($amount > $payment->refundableAmount()) {
            throw ValidationException::withMessages([
                'amount' => 'Refund amount cannot be greater than the remaining refundable balance.',
            ]);
        }

        if ($method === PaymentMethod::PayPal && ! $payment->provider_capture_id) {
            throw ValidationException::withMessages([
                'method' => 'This payment does not have a PayPal capture ID to refund.',
            ]);
        }

        if ($method === PaymentMethod::PayPal && ! $this->paypal->configured()) {
            throw ValidationException::withMessages([
                'method' => 'PayPal is not configured for refunds.',
            ]);
        }
    }

    private function finalizeRefund(Payment $payment, PaymentRefund $refund, User $actor): Payment
    {
        $refunded = $payment->refundedAmount();
        $amount = (float) $payment->amount;
        $status = $refunded >= $amount
            ? PaymentStatus::Refunded
            : PaymentStatus::PartiallyRefunded;

        $payment->update([
            'status' => $status,
        ]);

        $payment->workJob?->remarks()->create([
            'user_id' => $actor->id,
            'action' => 'payment_refunded',
            'message' => $this->remarkMessage($payment, $refund),
        ]);

        $freshPayment = $payment->fresh([
            'refunds.creator',
            'creator',
            'payer',
            'quotation',
            'workJob.workers',
            'workJob.appointment',
        ]);

        PaymentRefunded::dispatch(
            $freshPayment,
            $refund->fresh(['creator']),
            $freshPayment->workJob,
            $this->remarkMessage($freshPayment, $refund),
            $actor
        );

        return $freshPayment;
    }

    private function remarkMessage(Payment $payment, PaymentRefund $refund): string
    {
        $amount = number_format((float) $refund->amount, 2);
        $method = $refund->method?->label() ?? 'Manual';
        $reason = $refund->reason ? " Reason: {$refund->reason}" : '';

        return "Refund recorded for {$payment->payment_number}: {$payment->currency} {$amount} via {$method}.{$reason}";
    }

    private function paypalRefundFailureMessage(RequestException $exception): string
    {
        $response = $exception->response?->json();
        $message = data_get($response, 'message')
            ?: data_get($response, 'details.0.description')
            ?: 'PayPal rejected the refund request.';
        $debugId = data_get($response, 'debug_id');

        return $debugId ? "{$message} PayPal debug ID: {$debugId}." : $message;
    }
}
