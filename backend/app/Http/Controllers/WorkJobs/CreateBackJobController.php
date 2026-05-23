<?php

namespace App\Http\Controllers\WorkJobs;

use App\Http\Controllers\Concerns\AuthorizesAssignedWork;
use App\Http\Controllers\Controller;
use App\Http\Requests\WorkJobs\StoreBackJobRequest;
use App\Http\Resources\WorkJobResource;
use App\Models\WorkJob;
use App\Services\WorkJobService;
use Illuminate\Http\JsonResponse;

class CreateBackJobController extends Controller
{
    use AuthorizesAssignedWork;

    public function __construct(
        private readonly WorkJobService $workJobService
    ) {}

    public function __invoke(StoreBackJobRequest $request, WorkJob $workJob): JsonResponse
    {
        $this->abortIfWorker($request, 'Workers cannot create back jobs.');

        $backJob = $this->workJobService->createBackJob(
            $workJob,
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'message' => 'Back job created and scheduled successfully.',
            'data' => new WorkJobResource($backJob),
        ], 201);
    }
}
