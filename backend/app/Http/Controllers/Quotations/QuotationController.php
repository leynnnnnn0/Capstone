<?php
// app/Http/Controllers/Quotations/QuotationController.php

namespace App\Http\Controllers\Quotations;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quotations\StoreQuotationRequest;
use App\Http\Requests\Quotations\UpdateQuotationRequest;
use App\Http\Resources\QuotationResource;
use App\Models\Quotation;
use App\Services\QuotationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class QuotationController extends Controller
{
    public function __construct(
        private readonly QuotationService $quotationService
    ) {}

    public function show(Quotation $quotation): JsonResponse
    {
        $quotation->load([
            'appointment',
            'quotation_items.options',
            'quotation_items.before_images',
            'quotation_items.after_images',
        ]);

        return response()->json([
            'data' => new QuotationResource($quotation),
        ]);
    }

    public function store(StoreQuotationRequest $request): JsonResponse
    {
        try {
            $quotation = $this->quotationService->create($request->validated());

            return response()->json([
                'message' => 'Quotation created successfully.',
                'data'    => new QuotationResource($quotation),
            ], 201);
        } catch (Throwable $e) {
            Log::error('Failed to create quotation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while creating the quotation.',
            ], 500);
        }
    }

    public function update(UpdateQuotationRequest $request, Quotation $quotation): JsonResponse
    {
        try {
            $quotation = $this->quotationService->update(
                $quotation,
                $request->validated()
            );

            return response()->json([
                'message' => 'Quotation updated successfully.',
                'data'    => new QuotationResource($quotation),
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to update quotation', [
                'quotation_id' => $quotation->id,
                'error'        => $e->getMessage(),
                'trace'        => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while updating the quotation.',
            ], 500);
        }
    }
}
