<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\WorkJobChargeStatus;
use App\Enums\WorkJobChargeType;
use App\Events\PaymentRecorded;
use App\Models\Payment;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class WorkJobPaymentService
{
    private const PAYPAL_PENDING_REUSE_MINUTES = 30;

    public function __construct(private readonly PayPalClient $payPal) {}

    public function summary(WorkJob $workJob): array
    {
        $workJob->load([
            'quotation.quotation_items',
            'payments',
            'charges',
        ]);

        $sourceQuotationTotal = $this->quotationTotal($workJob);
        $isBackJob = (bool) $workJob->parent_work_job_id;
        $quotationTotal = $isBackJob ? 0.0 : $sourceQuotationTotal;
        $approvedChargesTotal = $this->approvedChargesTotal($workJob);
        $discountTotal = $this->approvedDiscountTotal($workJob);
        $pendingChargesTotal = $this->pendingChargesTotal($workJob);
        $payableTotal = max($quotationTotal + $approvedChargesTotal - $discountTotal, 0);
        $paid = $this->paidPayments($workJob)->sum(fn (Payment $payment) => (float) $payment->amount);
        $pending = $this->pendingPayments($workJob)->sum(fn (Payment $payment) => (float) $payment->amount);
        $remaining = max($payableTotal - $paid, 0);
        $downPaymentRequired = ! $isBackJob && (bool) $workJob->is_down_payment_required;
        $downPaymentPercentage = (float) ($workJob->down_payment_percentage ?? 20);
        $downPaymentAmount = $downPaymentRequired
            ? round($payableTotal * ($downPaymentPercentage / 100), 2)
            : 0.0;
        $downPaymentRemaining = $downPaymentRequired
            ? max($downPaymentAmount - $paid, 0)
            : 0.0;
        $additionalChargeAmount = $this->additionalChargeDueAmount(
            $quotationTotal,
            $approvedChargesTotal,
            $paid,
            $remaining,
            $isBackJob,
        );
        $paymentNotRequired = $isBackJob && $payableTotal <= 0;
        $canAcceptPayment = $payableTotal > 0
            && $remaining > 0
            && $workJob->status->value !== 'cancelled';

        $nextDueType = null;
        $nextDueAmount = 0.0;

        if ($remaining > 0) {
            if ($downPaymentRequired && $downPaymentRemaining > 0) {
                $nextDueType = PaymentType::DownPayment->value;
                $nextDueAmount = $downPaymentRemaining;
            } elseif ($additionalChargeAmount > 0) {
                $nextDueType = PaymentType::AdditionalCharge->value;
                $nextDueAmount = $additionalChargeAmount;
            } else {
                $nextDueType = $downPaymentRequired
                    ? PaymentType::FinalPayment->value
                    : PaymentType::FullPayment->value;
                $nextDueAmount = $remaining;
            }
        }

        $acceptedPaymentTypes = $this->acceptedPaymentTypes([
            'can_accept_payment' => $canAcceptPayment,
            'down_payment_required' => $downPaymentRequired,
            'down_payment_remaining_amount' => round($downPaymentRemaining, 2),
            'remaining_amount' => round($remaining, 2),
            'next_due_type' => $nextDueType,
            'additional_charge_amount' => round($additionalChargeAmount, 2),
        ]);
        $acceptedPaymentTypeValues = collect($acceptedPaymentTypes)
            ->map(fn (PaymentType $type) => $type->value)
            ->values()
            ->all();

        return [
            'currency' => config('paypal.currency', 'PHP'),
            'quotation_total' => round($quotationTotal, 2),
            'base_quotation_total' => round($quotationTotal, 2),
            'source_quotation_total' => round($sourceQuotationTotal, 2),
            'is_back_job_billing' => $isBackJob,
            'payment_not_required' => $paymentNotRequired,
            'approved_charges_total' => round($approvedChargesTotal, 2),
            'discount_total' => round($discountTotal, 2),
            'pending_charges_total' => round($pendingChargesTotal, 2),
            'payable_total' => round($payableTotal, 2),
            'paid_amount' => round($paid, 2),
            'pending_amount' => round($pending, 2),
            'remaining_amount' => round($remaining, 2),
            'remaining_after_pending_amount' => round(max($remaining - $pending, 0), 2),
            'is_fully_paid' => $paymentNotRequired || ($payableTotal > 0 && $remaining <= 0),
            'down_payment_required' => $downPaymentRequired,
            'down_payment_percentage' => $downPaymentPercentage,
            'down_payment_amount' => round($downPaymentAmount, 2),
            'down_payment_remaining_amount' => round($downPaymentRemaining, 2),
            'down_payment_satisfied' => ! $downPaymentRequired || $downPaymentRemaining <= 0,
            'final_payment_amount' => round($remaining, 2),
            'additional_charge_amount' => round($additionalChargeAmount, 2),
            'next_due_type' => $nextDueType,
            'next_due_amount' => round($nextDueAmount, 2),
            'has_pending_online_payment' => $pending > 0,
            'accepted_payment_types' => $acceptedPaymentTypeValues,
            'can_pay_down_payment' => in_array(PaymentType::DownPayment, $acceptedPaymentTypes, true),
            'can_pay_final_payment' => in_array(PaymentType::FinalPayment, $acceptedPaymentTypes, true),
            'can_pay_full_payment' => in_array(PaymentType::FullPayment, $acceptedPaymentTypes, true),
            'can_pay_additional_charge' => in_array(PaymentType::AdditionalCharge, $acceptedPaymentTypes, true),
            'can_accept_payment' => $canAcceptPayment,
        ];
    }

    public function createPayPalOrder(WorkJob $workJob, PaymentType $type, ?User $payer): array
    {
        if (! $this->payPal->configured()) {
            throw ValidationException::withMessages([
                'paypal' => 'PayPal is not configured yet.',
            ]);
        }

        $amount = $this->amountDueFor($workJob, $type);
        $existing = $this->reusablePendingPayPalPayment($workJob, $type, $amount);

        if ($existing) {
            $this->cancelPendingPayPalPayments(
                $workJob,
                except: $existing,
                reason: 'Superseded by an active PayPal checkout session.'
            );

            return [
                'payment' => $existing->fresh(['payer', 'creator']),
                'order' => $existing->metadata['paypal_order'] ?? [
                    'id' => $existing->provider_order_id,
                    'status' => 'PAYER_ACTION_REQUIRED',
                    'reused' => true,
                ],
            ];
        }

        $payment = DB::transaction(function () use ($workJob, $type, $payer, $amount) {
            $this->cancelPendingPayPalPayments(
                $workJob,
                reason: 'Superseded by a newer PayPal checkout session.'
            );

            return Payment::create([
                'work_job_id' => $workJob->id,
                'quotation_id' => $workJob->quotation_id,
                'payer_id' => $payer?->id,
                'type' => $type,
                'method' => PaymentMethod::PayPal,
                'status' => PaymentStatus::Pending,
                'amount' => $amount,
                'currency' => $this->payPal->currency(),
                'provider' => 'paypal',
                'metadata' => [
                    'summary_at_creation' => $this->summary($workJob),
                ],
            ]);
        });

        $payment->refresh();

        try {
            $order = $this->payPal->createOrder($payment->load('workJob'));
        } catch (Throwable $exception) {
            $payment->update([
                'status' => PaymentStatus::Failed,
                'remarks' => 'PayPal order creation failed before checkout started.',
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'paypal_create_error' => [
                        'message' => $exception->getMessage(),
                        'failed_at' => now()->toISOString(),
                    ],
                ],
            ]);

            throw $exception;
        }

        $payment->update([
            'provider_order_id' => $order['id'] ?? null,
            'metadata' => [
                ...($payment->metadata ?? []),
                'paypal_order' => $order,
            ],
        ]);

        return [
            'payment' => $payment->fresh(['payer', 'creator']),
            'order' => $order,
        ];
    }

    public function capturePayPalPayment(
        WorkJob $workJob,
        Payment $payment,
        string $orderId,
        ?User $actor
    ): WorkJob {
        if ((int) $payment->work_job_id !== (int) $workJob->id) {
            abort(404);
        }

        if ($payment->status !== PaymentStatus::Pending || $payment->provider_order_id !== $orderId) {
            throw ValidationException::withMessages([
                'payment' => 'This PayPal payment can no longer be captured.',
            ]);
        }

        $capture = $this->payPal->captureOrder($orderId, $payment);
        $completed = ($capture['status'] ?? null) === 'COMPLETED';
        $captureData = $capture['purchase_units'][0]['payments']['captures'][0] ?? [];

        DB::transaction(function () use ($workJob, $payment, $capture, $captureData, $completed, $actor) {
            $payment->update([
                'status' => $completed ? PaymentStatus::Paid : PaymentStatus::Failed,
                'provider_capture_id' => $captureData['id'] ?? null,
                'provider_payer_id' => $capture['payer']['payer_id'] ?? null,
                'provider_payer_email' => $capture['payer']['email_address'] ?? null,
                'paid_at' => $completed ? now() : null,
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'paypal_capture' => $capture,
                ],
            ]);

            if ($completed) {
                $this->cancelPendingPayPalPayments(
                    $workJob,
                    except: $payment,
                    reason: 'Superseded by a completed PayPal payment.'
                );

                $payment->workJob->remarks()->create([
                    'user_id' => $actor?->id,
                    'action' => 'payment_paid',
                    'message' => "{$payment->type->label()} paid through PayPal ({$payment->currency} " . number_format((float) $payment->amount, 2) . ').',
                ]);
            }
        });

        $workJob = $workJob->fresh()->load($this->relations());

        if ($completed) {
            PaymentRecorded::dispatch(
                $payment->fresh(['payer', 'creator']),
                $workJob,
                "{$payment->type->label()} paid through PayPal.",
                $actor
            );
        }

        return $workJob;
    }

    public function recordManualPayment(WorkJob $workJob, array $data, User $actor): WorkJob
    {
        $type = PaymentType::from($data['type']);
        $method = PaymentMethod::from($data['method']);
        $amount = round((float) $data['amount'], 2);
        $summary = $this->summary($workJob);

        if ($method === PaymentMethod::PayPal) {
            throw ValidationException::withMessages([
                'method' => 'Use PayPal capture for online PayPal payments.',
            ]);
        }

        if (! $summary['can_accept_payment']) {
            throw ValidationException::withMessages([
                'payment' => 'This work job has no payable balance.',
            ]);
        }

        $this->validateManualPaymentType($summary, $type, $amount);

        if ($amount <= 0 || $amount > (float) $summary['remaining_amount']) {
            throw ValidationException::withMessages([
                'amount' => 'Amount must be greater than zero and not exceed the remaining balance.',
            ]);
        }

        $payment = DB::transaction(function () use ($workJob, $type, $method, $amount, $data, $actor, $summary) {
            $payment = Payment::create([
                'work_job_id' => $workJob->id,
                'quotation_id' => $workJob->quotation_id,
                'payer_id' => null,
                'created_by' => $actor->id,
                'type' => $type,
                'method' => $method,
                'status' => PaymentStatus::Paid,
                'amount' => $amount,
                'currency' => config('paypal.currency', 'PHP'),
                'paid_at' => $data['paid_at'] ?? now(),
                'remarks' => $data['remarks'] ?? null,
                'metadata' => [
                    'summary_at_recording' => $summary,
                ],
            ]);

            $workJob->remarks()->create([
                'user_id' => $actor->id,
                'action' => 'payment_paid',
                'message' => "{$payment->type->label()} recorded as {$payment->method->label()} ({$payment->currency} " . number_format((float) $payment->amount, 2) . ').',
            ]);

            $this->cancelPendingPayPalPayments(
                $workJob,
                reason: 'Cancelled because an offline payment changed the payable balance.'
            );

            return $payment;
        });

        $workJob = $workJob->fresh()->load($this->relations());

        PaymentRecorded::dispatch(
            $payment->fresh(['creator']),
            $workJob,
            "{$payment->type->label()} recorded as {$payment->method->label()}.",
            $actor
        );

        return $workJob;
    }

    private function amountDueFor(WorkJob $workJob, PaymentType $type): float
    {
        $summary = $this->summary($workJob);

        if (! $summary['can_accept_payment']) {
            throw ValidationException::withMessages([
                'payment' => 'This work job has no payable balance.',
            ]);
        }

        return match ($type) {
            PaymentType::FullPayment => $this->fullPaymentDue($summary),
            PaymentType::DownPayment => $this->downPaymentDue($summary),
            PaymentType::FinalPayment => $this->finalPaymentDue($summary),
            PaymentType::AdditionalCharge => $this->additionalChargeDue($summary),
        };
    }

    private function fullPaymentDue(array $summary): float
    {
        $this->ensurePaymentTypeIsAccepted($summary, PaymentType::FullPayment);

        if ($summary['next_due_type'] === PaymentType::AdditionalCharge->value) {
            throw ValidationException::withMessages([
                'type' => 'Use additional charge payment for post-payment charges.',
            ]);
        }

        return (float) $summary['remaining_amount'];
    }

    private function downPaymentDue(array $summary): float
    {
        $this->ensurePaymentTypeIsAccepted($summary, PaymentType::DownPayment);

        if (! $summary['down_payment_required'] || (float) $summary['down_payment_remaining_amount'] <= 0) {
            throw ValidationException::withMessages([
                'type' => 'Down payment is not due for this work job.',
            ]);
        }

        return (float) $summary['down_payment_remaining_amount'];
    }

    private function finalPaymentDue(array $summary): float
    {
        $this->ensurePaymentTypeIsAccepted($summary, PaymentType::FinalPayment);

        if ($summary['next_due_type'] === PaymentType::AdditionalCharge->value) {
            throw ValidationException::withMessages([
                'type' => 'Use additional charge payment for post-payment charges.',
            ]);
        }

        if ($summary['down_payment_required'] && (float) $summary['down_payment_remaining_amount'] > 0) {
            throw ValidationException::withMessages([
                'type' => 'The down payment must be paid before the remaining balance.',
            ]);
        }

        return (float) $summary['remaining_amount'];
    }

    private function additionalChargeDue(array $summary): float
    {
        $this->ensurePaymentTypeIsAccepted($summary, PaymentType::AdditionalCharge);

        if (
            $summary['next_due_type'] !== PaymentType::AdditionalCharge->value
            || (float) ($summary['additional_charge_amount'] ?? 0) <= 0
        ) {
            throw ValidationException::withMessages([
                'type' => 'Additional charge payment is not due for this work job.',
            ]);
        }

        return (float) $summary['additional_charge_amount'];
    }

    private function validateManualPaymentType(array $summary, PaymentType $type, float $amount): void
    {
        $this->ensurePaymentTypeIsAccepted($summary, $type);

        if ($type === PaymentType::FullPayment && $summary['next_due_type'] === PaymentType::AdditionalCharge->value) {
            throw ValidationException::withMessages([
                'type' => 'Use additional charge payment for post-payment charges.',
            ]);
        }

        if ($type === PaymentType::DownPayment) {
            if (! $summary['down_payment_required'] || (float) $summary['down_payment_remaining_amount'] <= 0) {
                throw ValidationException::withMessages([
                    'type' => 'Down payment is not due for this work job.',
                ]);
            }

            if ($amount > (float) $summary['down_payment_remaining_amount']) {
                throw ValidationException::withMessages([
                    'amount' => 'Down payment amount cannot exceed the remaining down payment due.',
                ]);
            }
        }

        if (
            $type === PaymentType::FinalPayment
            && $summary['down_payment_required']
            && (float) $summary['down_payment_remaining_amount'] > 0
        ) {
            throw ValidationException::withMessages([
                'type' => 'The down payment must be paid before the remaining balance.',
            ]);
        }

        if ($type === PaymentType::AdditionalCharge) {
            if (
                $summary['next_due_type'] !== PaymentType::AdditionalCharge->value
                || (float) ($summary['additional_charge_amount'] ?? 0) <= 0
            ) {
                throw ValidationException::withMessages([
                    'type' => 'Additional charge payment is not due for this work job.',
                ]);
            }

            if ($amount > (float) $summary['additional_charge_amount']) {
                throw ValidationException::withMessages([
                    'amount' => 'Additional charge payment cannot exceed the approved extra balance.',
                ]);
            }
        }
    }

    /**
     * @return list<PaymentType>
     */
    private function acceptedPaymentTypes(array $summary): array
    {
        if (! ($summary['can_accept_payment'] ?? false) || (float) ($summary['remaining_amount'] ?? 0) <= 0) {
            return [];
        }

        if (
            ($summary['next_due_type'] ?? null) === PaymentType::AdditionalCharge->value
            && (float) ($summary['additional_charge_amount'] ?? 0) > 0
        ) {
            return [PaymentType::AdditionalCharge];
        }

        if (! ($summary['down_payment_required'] ?? false)) {
            return [PaymentType::FullPayment];
        }

        if ((float) ($summary['down_payment_remaining_amount'] ?? 0) > 0) {
            $types = [PaymentType::DownPayment];

            if ((float) ($summary['remaining_amount'] ?? 0) > (float) ($summary['down_payment_remaining_amount'] ?? 0)) {
                $types[] = PaymentType::FullPayment;
            }

            return $types;
        }

        return [PaymentType::FinalPayment];
    }

    private function ensurePaymentTypeIsAccepted(array $summary, PaymentType $type): void
    {
        if (! in_array($type, $this->acceptedPaymentTypes($summary), true)) {
            throw ValidationException::withMessages([
                'type' => 'This payment type is not currently due for this work job.',
            ]);
        }
    }

    private function additionalChargeDueAmount(
        float $quotationTotal,
        float $approvedChargesTotal,
        float $paid,
        float $remaining,
        bool $forceAdditionalCharge = false
    ): float {
        if ($approvedChargesTotal <= 0 || $remaining <= 0) {
            return 0.0;
        }

        if ($forceAdditionalCharge) {
            return $remaining;
        }

        if ($paid <= 0) {
            return 0.0;
        }

        return $paid >= $quotationTotal ? $remaining : 0.0;
    }

    private function quotationTotal(WorkJob $workJob): float
    {
        if (! $workJob->quotation) {
            return 0.0;
        }

        $items = $workJob->quotation->relationLoaded('quotation_items')
            ? $workJob->quotation->quotation_items
            : $workJob->quotation->quotation_items()->get();

        $subtotal = $items
            ->where('status', 'approved')
            ->sum(fn ($item) => (float) $item->total_amount);

        return max($subtotal - (float) ($workJob->quotation->discount ?? 0), 0);
    }

    private function paidPayments(WorkJob $workJob)
    {
        return $workJob->relationLoaded('payments')
            ? $workJob->payments->filter(fn (Payment $payment) => $payment->status === PaymentStatus::Paid)
            : $workJob->payments()->where('status', PaymentStatus::Paid->value)->get();
    }

    private function pendingPayments(WorkJob $workJob)
    {
        return $workJob->relationLoaded('payments')
            ? $workJob->payments->filter(fn (Payment $payment) => $payment->status === PaymentStatus::Pending)
            : $workJob->payments()->where('status', PaymentStatus::Pending->value)->get();
    }

    private function approvedChargesTotal(WorkJob $workJob): float
    {
        return $this->charges($workJob)
            ->filter(fn ($charge) => $charge->status === WorkJobChargeStatus::Approved && $charge->type !== WorkJobChargeType::Discount)
            ->sum(fn ($charge) => (float) $charge->amount);
    }

    private function approvedDiscountTotal(WorkJob $workJob): float
    {
        return $this->charges($workJob)
            ->filter(fn ($charge) => $charge->status === WorkJobChargeStatus::Approved && $charge->type === WorkJobChargeType::Discount)
            ->sum(fn ($charge) => (float) $charge->amount);
    }

    private function pendingChargesTotal(WorkJob $workJob): float
    {
        return $this->charges($workJob)
            ->filter(fn ($charge) => $charge->status === WorkJobChargeStatus::PendingApproval)
            ->sum(fn ($charge) => (float) $charge->amount);
    }

    private function charges(WorkJob $workJob)
    {
        return $workJob->relationLoaded('charges')
            ? $workJob->charges
            : $workJob->charges()->get();
    }

    private function cancelPendingPayPalPayments(
        WorkJob $workJob,
        ?PaymentType $type = null,
        ?Payment $except = null,
        string $reason = 'Superseded by a newer PayPal checkout session.'
    ): void {
        $query = Payment::query()
            ->where('work_job_id', $workJob->id)
            ->where('method', PaymentMethod::PayPal->value)
            ->where('status', PaymentStatus::Pending->value);

        if ($type) {
            $query->where('type', $type->value);
        }

        if ($except) {
            $query->whereKeyNot($except->id);
        }

        $query->get()->each(function (Payment $payment) use ($reason) {
            $payment->update([
                'status' => PaymentStatus::Cancelled,
                'remarks' => $payment->remarks ?: $reason,
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'cancelled_reason' => 'superseded_paypal_checkout',
                    'cancelled_at' => now()->toISOString(),
                ],
            ]);
        });
    }

    private function reusablePendingPayPalPayment(WorkJob $workJob, PaymentType $type, float $amount): ?Payment
    {
        return Payment::query()
            ->where('work_job_id', $workJob->id)
            ->where('type', $type->value)
            ->where('method', PaymentMethod::PayPal->value)
            ->where('status', PaymentStatus::Pending->value)
            ->where('amount', number_format($amount, 2, '.', ''))
            ->whereNotNull('provider_order_id')
            ->where('created_at', '>=', now()->subMinutes(self::PAYPAL_PENDING_REUSE_MINUTES))
            ->latest('created_at')
            ->first();
    }

    private function relations(): array
    {
        return [
            'workers',
            'appointment.workJob',
            'quotation.quotation_items.options',
            'quotation.quotation_items.product.product_images',
            'quotation.quotation_items.before_images',
            'quotation.quotation_items.after_images',
            'payments.payer',
            'payments.creator',
            'charges.creator',
            'charges.approver',
            'remarks.user',
        ];
    }
}
