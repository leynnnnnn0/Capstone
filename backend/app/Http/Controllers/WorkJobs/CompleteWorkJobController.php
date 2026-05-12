<?php
// app/Http/Controllers/WorkJobs/CompleteWorkJobController.php

namespace App\Http\Controllers\WorkJobs;

use App\Exceptions\InvalidStatusTransitionException;
use App\Http\Controllers\Controller;
use App\Http\Resources\WorkJobResource;
use App\Models\WorkJob;
use App\Services\WorkJobService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class CompleteWorkJobController extends Controller
{
    public function __construct(
        private readonly WorkJobService $workJobService
    ) {}

    public function __invoke(WorkJob $workJob): JsonResponse
    {
        try {
            $workJob = $this->workJobService->complete($workJob);

            return response()->json([
                'message' => 'Work job completed.',
                'data'    => new WorkJobResource($workJob),
            ]);
        } catch (InvalidStatusTransitionException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('Failed to complete work job', [
                'work_job_id' => $workJob->id,
                'error'       => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Something went wrong.'], 500);
        }
    }
}
