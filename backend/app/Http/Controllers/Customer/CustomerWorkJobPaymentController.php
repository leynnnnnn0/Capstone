<?php

namespace App\Http\Controllers\Customer;

use App\Enums\PaymentType;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\WorkJobResource;
use App\Models\Payment;
use App\Models\WorkJob;
use App\Services\Customer\CustomerRecordAccess;
use App\Services\Payments\WorkJobPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerWorkJobPaymentController extends Controller
{
    public function __construct(
        private readonly CustomerRecordAccess $recordAccess,
        private readonly WorkJobPaymentService $payments
    ) {}

    public function createOrder(Request $request, WorkJob $workJob): JsonResponse
    {
        abort_unless($this->recordAccess->canAccessWorkJob($request->user(), $workJob), 404);

        $data = $request->validate([
            'type' => ['required', Rule::in(array_column(PaymentType::cases(), 'value'))],
        ]);

        $result = $this->payments->createPayPalOrder(
            $workJob,
            PaymentType::from($data['type']),
            $request->user()
        );

        return response()->json([
            'order_id' => $result['order']['id'] ?? null,
            'data' => new PaymentResource($result['payment']),
        ], 201);
    }

    public function capture(Request $request, WorkJob $workJob): JsonResponse
    {
        abort_unless($this->recordAccess->canAccessWorkJob($request->user(), $workJob), 404);

        $data = $request->validate([
            'payment_id' => ['required', 'integer', 'exists:payments,id'],
            'order_id' => ['required', 'string'],
        ]);

        $workJob = $this->payments->capturePayPalPayment(
            $workJob,
            Payment::findOrFail($data['payment_id']),
            $data['order_id'],
            $request->user()
        );

        return response()->json([
            'message' => 'Payment captured successfully.',
            'data' => new WorkJobResource($workJob),
        ]);
    }
}
