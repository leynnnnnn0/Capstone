<?php

namespace App\Http\Controllers\ArMeasurements;

use App\Http\Controllers\Controller;
use App\Http\Requests\ArMeasurements\ReviewArMeasurementSessionRequest;
use App\Http\Resources\ArMeasurementSessionResource;
use App\Models\ArMeasurementSession;
use App\Services\ArMeasurements\ArMeasurementAccess;
use Illuminate\Http\JsonResponse;

class ReviewArMeasurementSessionController extends Controller
{
    public function __construct(
        private readonly ArMeasurementAccess $access
    ) {}

    public function __invoke(
        ReviewArMeasurementSessionRequest $request,
        ArMeasurementSession $arMeasurementSession
    ): JsonResponse {
        abort_unless(
            $this->access->canReviewSession(
                $request->user(),
                $arMeasurementSession
            ),
            403,
            'This measurement session is not available for your review.'
        );

        $data = $request->validated();
        $arMeasurementSession->update([
            'status' => $data['status'],
            'review_notes' => $data['review_notes'] ?? null,
            'reviewed_by_user_id' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $arMeasurementSession
            ->load([
                'appointment',
                'creator',
                'reviewer',
                'measurements',
            ])
            ->loadCount('measurements');

        return response()->json([
            'message' => 'Measurement review saved.',
            'data' => new ArMeasurementSessionResource($arMeasurementSession),
        ]);
    }
}
