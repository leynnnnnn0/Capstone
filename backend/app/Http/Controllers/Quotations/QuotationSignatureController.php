<?php

namespace App\Http\Controllers\Quotations;

use App\Http\Controllers\Concerns\AuthorizesAssignedWork;
use App\Http\Controllers\Controller;
use App\Http\Resources\QuotationResource;
use App\Models\Quotation;
use App\Services\QuotationSignatureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuotationSignatureController extends Controller
{
    use AuthorizesAssignedWork;

    public function __construct(private readonly QuotationSignatureService $signatureService) {}

    public function store(Request $request, Quotation $quotation): JsonResponse
    {
        $quotation->load(['appointment', 'quotation_items.options']);

        if ($quotation->appointment) {
            $this->abortIfWorkerNotAssignedToAppointment($request, $quotation->appointment);
        }

        $validated = $request->validate([
            'signature' => ['required', 'string'],
            'signer_name' => ['required', 'string', 'max:255'],
        ]);

        $quotation = $this->signatureService->sign($quotation, $validated, $request, $request->user());

        return response()->json([
            'message' => 'Quotation signed.',
            'data' => new QuotationResource($quotation),
        ]);
    }
}
