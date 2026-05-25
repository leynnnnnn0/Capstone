<?php

namespace App\Http\Controllers\Payments;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\Payments\PaymentRefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('payments.view'), 403);

        $perPage = min((int) $request->integer('per_page', 15), 100);

        $query = Payment::query()
            ->with([
                'creator',
                'payer',
                'refunds.creator',
                'quotation',
                'workJob.workers',
                'workJob.appointment',
            ])
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->string('search'));

                $query->where(function ($query) use ($search) {
                    $query
                        ->where('payment_number', 'like', "%{$search}%")
                        ->orWhere('provider_order_id', 'like', "%{$search}%")
                        ->orWhere('provider_capture_id', 'like', "%{$search}%")
                        ->orWhere('provider_payer_email', 'like', "%{$search}%")
                        ->orWhereHas('workJob', function ($query) use ($search) {
                            $query
                                ->where('work_job_number', 'like', "%{$search}%")
                                ->orWhere('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('phone_number', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when(
                $request->filled('status') && $request->status !== 'all',
                fn ($query) => $query->where('status', $request->status)
            )
            ->when(
                ! $request->filled('status'),
                fn ($query) => $query->where('status', '!=', PaymentStatus::Cancelled->value)
            )
            ->when(
                $request->filled('method') && $request->method !== 'all',
                fn ($query) => $query->where('method', $request->method)
            )
            ->when(
                $request->filled('type') && $request->type !== 'all',
                fn ($query) => $query->where('type', $request->type)
            )
            ->when(
                $request->filled('date_from'),
                fn ($query) => $query->whereDate('created_at', '>=', $request->date_from)
            )
            ->when(
                $request->filled('date_to'),
                fn ($query) => $query->whereDate('created_at', '<=', $request->date_to)
            );

        $summaryQuery = clone $query;

        $payments = $query
            ->latest('created_at')
            ->paginate($perPage);

        $summaryPayments = $summaryQuery->get();
        $capturedPayments = $summaryPayments->filter(fn (Payment $payment) => $payment->capturedForRevenue());

        return response()->json([
            'data' => PaymentResource::collection($payments->getCollection())->resolve($request),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
                'from' => $payments->firstItem(),
                'to' => $payments->lastItem(),
            ],
            'summary' => [
                'total_count' => $summaryPayments->count(),
                'paid_count' => $capturedPayments->count(),
                'pending_count' => $summaryPayments->filter(fn (Payment $payment) => $payment->status === PaymentStatus::Pending)->count(),
                'failed_count' => $summaryPayments->filter(fn (Payment $payment) => $payment->status === PaymentStatus::Failed)->count(),
                'refunded_count' => $summaryPayments->filter(fn (Payment $payment) => $payment->refundedAmount() > 0)->count(),
                'total_paid' => round($capturedPayments->sum(fn (Payment $payment) => $payment->netAmount()), 2),
                'refunded_amount' => round($capturedPayments->sum(fn (Payment $payment) => $payment->refundedAmount()), 2),
            ],
            'options' => [
                'statuses' => collect(PaymentStatus::cases())->map(fn (PaymentStatus $status) => [
                    'value' => $status->value,
                    'label' => $status->label(),
                ])->values(),
                'methods' => collect(PaymentMethod::cases())->map(fn (PaymentMethod $method) => [
                    'value' => $method->value,
                    'label' => $method->label(),
                ])->values(),
                'types' => collect(PaymentType::cases())->map(fn (PaymentType $type) => [
                    'value' => $type->value,
                    'label' => $type->label(),
                ])->values(),
            ],
        ]);
    }

    public function refund(Payment $payment, Request $request, PaymentRefundService $refunds): JsonResponse
    {
        abort_unless($request->user()?->can('payments.refund'), 403);

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $payment = $refunds->refund($payment, $data, $request->user());

        return response()->json([
            'data' => (new PaymentResource($payment))->resolve($request),
        ]);
    }
}
