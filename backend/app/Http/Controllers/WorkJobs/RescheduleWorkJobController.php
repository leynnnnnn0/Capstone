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

class RescheduleWorkJobController extends Controller
{
    use AuthorizesAssignedWork;

    public function __construct(
        private readonly WorkJobService $workJobService
    ) {}

    public function __invoke(Request $request, WorkJob $workJob): JsonResponse
    {
        $this->abortIfWorker($request, 'Workers cannot reschedule work jobs.');

        try {
            $validated = $request->validate([
                'scheduled_date' => ['required', 'date', 'after_or_equal:today'],
                'scheduled_time_from' => ['required', 'date_format:H:i'],
                'scheduled_time_until' => ['required', 'date_format:H:i', 'after:scheduled_time_from'],
                'reason' => ['required', 'string', 'max:500'],
                'worker_ids' => ['sometimes', 'array', 'min:1'],
                'worker_ids.*' => ['integer', 'exists:users,id'],
            ]);

            $workJob = $this->workJobService->reschedule($workJob, $validated, $request->user());

            return response()->json([
                'message' => 'Work job rescheduled.',
                'data' => new WorkJobResource($workJob),
            ]);
        } catch (InvalidStatusTransitionException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('Failed to reschedule work job', ['work_job_id' => $workJob->id, 'error' => $e->getMessage()]);

            return response()->json(['message' => 'Something went wrong.'], 500);
        }
    }
}
