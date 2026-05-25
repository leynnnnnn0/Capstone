<?php

namespace App\Services\Reports;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\WorkJobStatus;
use App\Models\Payment;
use App\Models\QuotationItem;
use App\Models\WorkJob;
use App\Services\Payments\WorkJobPaymentService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class SalesReportService
{
    public function __construct(private readonly WorkJobPaymentService $paymentService) {}

    public function build(array $filters = []): array
    {
        $groupBy = ($filters['group_by'] ?? null) === 'month' ? 'month' : 'day';
        $payments = $this->payments($filters);

        $capturedPayments = $this->capturedPayments($payments);
        $pendingPayments = $payments->filter(fn (Payment $payment) => $payment->status === PaymentStatus::Pending);
        $refundedPayments = $this->refundedPayments($capturedPayments);
        $outstandingWorkJobs = $this->outstandingWorkJobs();

        $grossSales = $this->sumAmount($capturedPayments);
        $netSales = $this->sumNetAmount($capturedPayments);
        $pendingAmount = $this->sumAmount($pendingPayments);
        $refundedAmount = $this->sumRefundedAmount($capturedPayments);
        $outstandingAmount = $outstandingWorkJobs->sum('remaining_amount');
        $paidCount = $capturedPayments->count();

        return [
            'summary' => [
                'gross_sales' => round($grossSales, 2),
                'net_sales' => round($netSales, 2),
                'pending_amount' => round($pendingAmount, 2),
                'refunded_amount' => round($refundedAmount, 2),
                'outstanding_amount' => round($outstandingAmount, 2),
                'additional_charges_paid' => round($this->additionalChargesPaid($capturedPayments), 2),
                'paid_count' => $paidCount,
                'pending_count' => $pendingPayments->count(),
                'failed_count' => $payments->filter(fn (Payment $payment) => $payment->status === PaymentStatus::Failed)->count(),
                'refunded_count' => $refundedPayments->count(),
                'average_payment' => round($paidCount > 0 ? $netSales / $paidCount : 0, 2),
                'collection_rate' => round(($netSales + $outstandingAmount) > 0 ? ($netSales / ($netSales + $outstandingAmount)) * 100 : 0, 2),
            ],
            'charts' => [
                'sales_by_period' => $this->salesByPeriod($payments, $groupBy),
                'payment_methods' => $this->paymentMethodBreakdown($capturedPayments),
                'payment_types' => $this->paymentTypeBreakdown($capturedPayments),
                'status_breakdown' => $this->statusBreakdown($payments),
                'top_products' => $this->topProducts($capturedPayments),
            ],
            'tables' => [
                'recent_payments' => $this->recentPayments($payments),
                'top_customers' => $this->topCustomers($capturedPayments),
                'top_work_jobs' => $this->topWorkJobs($capturedPayments),
                'outstanding_work_jobs' => $outstandingWorkJobs->take(10)->values(),
            ],
            'export_rows' => $this->exportRows($payments),
            'filters' => [
                'date_from' => $filters['date_from'] ?? null,
                'date_to' => $filters['date_to'] ?? null,
                'group_by' => $groupBy,
            ],
        ];
    }

    private function payments(array $filters): Collection
    {
        return Payment::query()
            ->with([
                'creator',
                'payer',
                'refunds.creator',
                'quotation',
                'workJob.workers',
                'workJob.appointment',
            ])
            ->when(
                filled($filters['date_from'] ?? null),
                fn ($query) => $query->whereDate('created_at', '>=', $filters['date_from'])
            )
            ->when(
                filled($filters['date_to'] ?? null),
                fn ($query) => $query->whereDate('created_at', '<=', $filters['date_to'])
            )
            ->where('status', '!=', PaymentStatus::Cancelled->value)
            ->latest('created_at')
            ->get();
    }

    private function salesByPeriod(Collection $payments, string $groupBy): array
    {
        return $payments
            ->groupBy(fn (Payment $payment) => $this->periodKey($payment, $groupBy))
            ->map(function (Collection $group, string $period) use ($groupBy) {
                $capturedPayments = $this->capturedPayments($group);

                return [
                    'period' => $this->periodLabel($period, $groupBy),
                    'sales' => round($this->sumNetAmount($capturedPayments), 2),
                    'pending' => round($this->sumAmount($group->filter(fn (Payment $payment) => $payment->status === PaymentStatus::Pending)), 2),
                    'payments' => $capturedPayments->count(),
                ];
            })
            ->sortKeys()
            ->values()
            ->all();
    }

    private function paymentMethodBreakdown(Collection $paidPayments): array
    {
        return collect(PaymentMethod::cases())
            ->map(function (PaymentMethod $method) use ($paidPayments) {
                $payments = $paidPayments->filter(fn (Payment $payment) => $payment->method === $method);

                return [
                    'method' => $method->label(),
                    'value' => round($this->sumNetAmount($payments), 2),
                    'count' => $payments->count(),
                ];
            })
            ->filter(fn (array $row) => $row['count'] > 0)
            ->values()
            ->all();
    }

    private function paymentTypeBreakdown(Collection $paidPayments): array
    {
        return collect(PaymentType::cases())
            ->map(function (PaymentType $type) use ($paidPayments) {
                $payments = $paidPayments->filter(fn (Payment $payment) => $payment->type === $type);

                return [
                    'type' => $type->label(),
                    'value' => round($this->sumNetAmount($payments), 2),
                    'count' => $payments->count(),
                ];
            })
            ->filter(fn (array $row) => $row['count'] > 0)
            ->values()
            ->all();
    }

    private function statusBreakdown(Collection $payments): array
    {
        return collect(PaymentStatus::cases())
            ->reject(fn (PaymentStatus $status) => $status === PaymentStatus::Cancelled)
            ->map(function (PaymentStatus $status) use ($payments) {
                $statusPayments = $payments->filter(fn (Payment $payment) => $payment->status === $status);

                return [
                    'status' => $status->label(),
                    'value' => round($this->statusBreakdownAmount($status, $statusPayments), 2),
                    'count' => $statusPayments->count(),
                ];
            })
            ->values()
            ->all();
    }

    private function topProducts(Collection $paidPayments): array
    {
        $quotationIds = $paidPayments
            ->pluck('quotation_id')
            ->filter()
            ->unique()
            ->values();

        if ($quotationIds->isEmpty()) {
            return [];
        }

        return QuotationItem::query()
            ->whereIn('quotation_id', $quotationIds)
            ->where('status', 'approved')
            ->selectRaw('name, SUM(total_amount) as revenue, SUM(pieces) as pieces, COUNT(*) as line_count')
            ->groupBy('name')
            ->orderByDesc('revenue')
            ->limit(8)
            ->get()
            ->map(fn (QuotationItem $item) => [
                'name' => $item->name,
                'revenue' => round((float) $item->revenue, 2),
                'pieces' => (int) $item->pieces,
                'line_count' => (int) $item->line_count,
            ])
            ->values()
            ->all();
    }

    private function recentPayments(Collection $payments): array
    {
        return $payments
            ->take(10)
            ->map(fn (Payment $payment) => $this->paymentRow($payment))
            ->values()
            ->all();
    }

    private function topCustomers(Collection $paidPayments): array
    {
        return $paidPayments
            ->groupBy(function (Payment $payment) {
                $workJob = $payment->workJob;

                return strtolower($workJob?->email ?: $workJob?->phone_number ?: $workJob?->full_name ?: "payment-{$payment->id}");
            })
            ->map(function (Collection $payments) {
                /** @var Payment $payment */
                $payment = $payments->first();
                $workJob = $payment->workJob;

                return [
                    'name' => $workJob?->full_name ?: $payment->provider_payer_email ?: 'Unknown Customer',
                    'contact' => $workJob?->phone_number ?: $workJob?->email ?: $payment->provider_payer_email,
                    'payments' => $payments->count(),
                    'total_paid' => round($this->sumNetAmount($payments), 2),
                ];
            })
            ->sortByDesc('total_paid')
            ->take(8)
            ->values()
            ->all();
    }

    private function topWorkJobs(Collection $paidPayments): array
    {
        return $paidPayments
            ->whereNotNull('work_job_id')
            ->groupBy('work_job_id')
            ->map(function (Collection $payments) {
                /** @var Payment $payment */
                $payment = $payments->first();
                $workJob = $payment->workJob;

                return [
                    'id' => $workJob?->id,
                    'work_job_number' => $workJob?->work_job_number ?: 'Unlinked Work Job',
                    'customer' => $workJob?->full_name ?: $payment->provider_payer_email,
                    'schedule' => $this->workJobSchedule($workJob),
                    'payments' => $payments->count(),
                    'total_paid' => round($this->sumNetAmount($payments), 2),
                ];
            })
            ->sortByDesc('total_paid')
            ->take(8)
            ->values()
            ->all();
    }

    private function outstandingWorkJobs(): Collection
    {
        return WorkJob::query()
            ->with([
                'quotation.quotation_items',
                'payments.refunds',
                'charges',
            ])
            ->where('status', '!=', WorkJobStatus::Cancelled->value)
            ->get()
            ->map(function (WorkJob $workJob) {
                $summary = $this->paymentService->summary($workJob);

                return [
                    'id' => $workJob->id,
                    'work_job_number' => $workJob->work_job_number,
                    'customer' => $workJob->full_name,
                    'status' => $workJob->status?->value,
                    'status_label' => $workJob->status?->label(),
                    'schedule' => $this->workJobSchedule($workJob),
                    'payable_total' => $summary['payable_total'],
                    'paid_amount' => $summary['paid_amount'],
                    'remaining_amount' => $summary['remaining_amount'],
                    'next_due_type' => $summary['next_due_type'],
                    'next_due_amount' => $summary['next_due_amount'],
                ];
            })
            ->filter(fn (array $row) => $row['remaining_amount'] > 0)
            ->sortByDesc('remaining_amount')
            ->values();
    }

    private function exportRows(Collection $payments): array
    {
        return $payments
            ->map(function (Payment $payment) {
                $row = $this->paymentRow($payment);

                return [
                    'Payment #' => $row['payment_number'],
                    'Work Job #' => $row['work_job_number'],
                    'Customer' => $row['customer'],
                    'Phone' => $row['phone'],
                    'Email' => $row['email'],
                    'Type' => $row['type_label'],
                    'Method' => $row['method_label'],
                    'Status' => $row['status_label'],
                    'Gross Amount' => $row['amount'],
                    'Refunded Amount' => $row['refunded_amount'],
                    'Net Amount' => $row['net_amount'],
                    'Currency' => $row['currency'],
                    'Provider Capture ID' => $row['provider_capture_id'],
                    'Recorded At' => $row['recorded_at'],
                ];
            })
            ->values()
            ->all();
    }

    private function paymentRow(Payment $payment): array
    {
        $workJob = $payment->workJob;

        return [
            'id' => $payment->id,
            'payment_number' => $payment->payment_number,
            'work_job_id' => $workJob?->id,
            'work_job_number' => $workJob?->work_job_number,
            'customer' => $workJob?->full_name ?: $payment->provider_payer_email,
            'phone' => $workJob?->phone_number,
            'email' => $workJob?->email ?: $payment->provider_payer_email,
            'type' => $payment->type?->value,
            'type_label' => $payment->type?->label(),
            'method' => $payment->method?->value,
            'method_label' => $payment->method?->label(),
            'status' => $payment->status?->value,
            'status_label' => $payment->status?->label(),
            'amount' => (float) $payment->amount,
            'refunded_amount' => $payment->refundedAmount(),
            'net_amount' => $payment->netAmount(),
            'refundable_amount' => $payment->refundableAmount(),
            'currency' => $payment->currency,
            'provider_capture_id' => $payment->provider_capture_id,
            'recorded_at' => optional($payment->paid_at ?? $payment->created_at)->toISOString(),
            'schedule' => $this->workJobSchedule($workJob),
        ];
    }

    private function additionalChargesPaid(Collection $paidPayments): float
    {
        return $this->sumNetAmount(
            $paidPayments->filter(fn (Payment $payment) => $payment->type === PaymentType::AdditionalCharge)
        );
    }

    private function capturedPayments(Collection $payments): Collection
    {
        return $payments->filter(fn (Payment $payment) => $payment->capturedForRevenue());
    }

    private function refundedPayments(Collection $payments): Collection
    {
        return $payments->filter(fn (Payment $payment) => $payment->refundedAmount() > 0);
    }

    private function sumAmount(Collection $payments): float
    {
        return $payments->sum(fn (Payment $payment) => (float) $payment->amount);
    }

    private function sumNetAmount(Collection $payments): float
    {
        return $payments->sum(fn (Payment $payment) => $payment->netAmount());
    }

    private function sumRefundedAmount(Collection $payments): float
    {
        return $payments->sum(fn (Payment $payment) => $payment->refundedAmount());
    }

    private function statusBreakdownAmount(PaymentStatus $status, Collection $payments): float
    {
        return in_array($status, [
            PaymentStatus::Paid,
            PaymentStatus::PartiallyRefunded,
            PaymentStatus::Refunded,
        ], true)
            ? $this->sumNetAmount($payments)
            : $this->sumAmount($payments);
    }

    private function periodKey(Payment $payment, string $groupBy): string
    {
        $date = CarbonImmutable::parse($payment->paid_at ?? $payment->created_at);

        return $groupBy === 'month'
            ? $date->format('Y-m')
            : $date->format('Y-m-d');
    }

    private function periodLabel(string $period, string $groupBy): string
    {
        $format = $groupBy === 'month' ? 'M Y' : 'M j';

        return CarbonImmutable::parse($period . ($groupBy === 'month' ? '-01' : ''))->format($format);
    }

    private function workJobSchedule(?WorkJob $workJob): ?string
    {
        if (! $workJob?->scheduled_date) {
            return null;
        }

        $date = CarbonImmutable::parse($workJob->scheduled_date)->format('M j, Y');
        $time = $workJob->scheduled_time_from && $workJob->scheduled_time_until
            ? "{$workJob->scheduled_time_from} - {$workJob->scheduled_time_until}"
            : null;

        return collect([$date, $time])->filter()->join(' · ');
    }
}
