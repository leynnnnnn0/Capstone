<?php

namespace App\Http\Controllers\WorkJobs;

use App\Exceptions\InvalidStatusTransitionException;
use App\Http\Controllers\Concerns\AuthorizesAssignedWork;
use App\Http\Controllers\Controller;
use App\Http\Resources\WorkJobResource;
use App\Models\WorkJob;
use App\Services\WorkJobService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class MarkOnTheWayController extends Controller
{
    use AuthorizesAssignedWork;

    public function __construct(
        private readonly WorkJobService $workJobService
    ) {}

    public function __invoke(Request $request, WorkJob $workJob): JsonResponse
    {
        $this->abortIfWorkerNotAssignedToWorkJob($request, $workJob);

        try {
            $validated = $request->validate([
                'remarks' => ['nullable', 'string', 'max:2000'],
            ]);

            $workJob = $this->workJobService->markOnTheWay($workJob, $request->user(), $validated['remarks'] ?? null);

            return response()->json([
                'message' => 'Work job marked as on the way.',
                'data' => new WorkJobResource($workJob),
            ]);
        } catch (InvalidStatusTransitionException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('Failed to mark work job on the way', ['work_job_id' => $workJob->id, 'error' => $e->getMessage()]);

            return response()->json(['message' => 'Something went wrong.'], 500);
        }
    }
}
