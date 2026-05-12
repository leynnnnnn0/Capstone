<?php
// app/Http/Controllers/Quotations/QuotationItemStatusController.php

namespace App\Http\Controllers\Quotations;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quotations\UpdateQuotationItemStatusRequest;
use App\Http\Resources\QuotationItemResource;
use App\Models\QuotationItem;
use App\Services\QuotationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class QuotationItemStatusController extends Controller
{
    public function __construct(
        private readonly QuotationService $quotationService
    ) {}

    public function __invoke(
        UpdateQuotationItemStatusRequest $request,
        QuotationItem $quotationItem
    ): JsonResponse {
        try {
            $item = $this->quotationService->updateItemStatus(
                $quotationItem,
                $request->validated()['status']
            );

            return response()->json([
                'message' => 'Item status updated successfully.',
                'data'    => new QuotationItemResource($item),
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to update quotation item status', [
                'quotation_item_id' => $quotationItem->id,
                'error'             => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while updating the item status.',
            ], 500);
        }
    }
}
