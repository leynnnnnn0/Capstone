<?php

namespace App\Http\Controllers\Tracking;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tracking\TrackRequest;
use App\Services\Tracking\TrackingService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;

class TrackingController extends Controller
{
    public function __construct(
        private readonly TrackingService $trackingService
    ) {}

    public function show(TrackRequest $request): JsonResponse
    {
        try {
            return response()->json([
                'data' => $this->trackingService->find($request->validated('reference')),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => 'We could not find a request with that reference number.',
            ], 404);
        }
    }
}
