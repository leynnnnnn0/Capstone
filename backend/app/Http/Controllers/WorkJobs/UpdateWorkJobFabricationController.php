<?php

namespace App\Http\Controllers\WorkJobs;

use App\Http\Controllers\Concerns\AuthorizesAssignedWork;
use App\Http\Controllers\Controller;
use App\Http\Requests\WorkJobs\UpdateWorkJobFabricationRequest;
use App\Http\Resources\WorkJobResource;
use App\Models\WorkJob;
use App\Services\WorkJobService;
use Illuminate\Http\JsonResponse;

class UpdateWorkJobFabricationController extends Controller
{
    use AuthorizesAssignedWork;

    public function __construct(private readonly WorkJobService $workJobService) {}

    public function __invoke(UpdateWorkJobFabricationRequest $request, WorkJob $workJob): JsonResponse
    {
        $this->abortIfWorkerNotAssignedToWorkJob($request, $workJob);

        $workJob = $this->workJobService->updateFabrication(
            $workJob,
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'message' => 'Fabrication progress updated.',
            'data' => new WorkJobResource($workJob),
        ]);
    }
}
