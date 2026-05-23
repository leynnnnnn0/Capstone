<?php

namespace App\Http\Controllers\WorkJobs;

use App\Enums\PaymentMethod;
use App\Enums\PaymentType;
use App\Http\Controllers\Concerns\AuthorizesAssignedWork;
use App\Http\Controllers\Controller;
use App\Http\Resources\WorkJobResource;
use App\Models\WorkJob;
use App\Services\Payments\WorkJobPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RecordWorkJobPaymentController extends Controller
{
    use AuthorizesAssignedWork;

    public function __construct(private readonly WorkJobPaymentService $payments) {}

    public function __invoke(Request $request, WorkJob $workJob): JsonResponse
    {
        $this->abortIfWorker($request, 'Workers cannot record manual payments.');

        $data = $request->validate([
            'type' => ['required', Rule::in(array_column(PaymentType::cases(), 'value'))],
            'method' => ['required', Rule::in([
                PaymentMethod::Cash->value,
                PaymentMethod::BankTransfer->value,
                PaymentMethod::Other->value,
            ])],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'paid_at' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $workJob = $this->payments->recordManualPayment($workJob, $data, $request->user());

        return response()->json([
            'message' => 'Payment recorded successfully.',
            'data' => new WorkJobResource($workJob),
        ]);
    }
}
