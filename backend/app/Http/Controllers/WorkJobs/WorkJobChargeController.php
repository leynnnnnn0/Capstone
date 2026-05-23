<?php

namespace App\Http\Controllers\WorkJobs;

use App\Enums\WorkJobChargeStatus;
use App\Enums\WorkJobChargeType;
use App\Http\Controllers\Concerns\AuthorizesAssignedWork;
use App\Http\Controllers\Controller;
use App\Http\Resources\WorkJobResource;
use App\Models\WorkJob;
use App\Models\WorkJobCharge;
use App\Services\WorkJobChargeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WorkJobChargeController extends Controller
{
    use AuthorizesAssignedWork;

    public function __construct(private readonly WorkJobChargeService $charges) {}

    public function store(Request $request, WorkJob $workJob): JsonResponse
    {
        $this->abortIfWorker($request, 'Workers cannot add work job charges.');

        $workJob = $this->charges->create($workJob, $this->validated($request), $request->user());

        return response()->json([
            'message' => 'Work job charge added successfully.',
            'data' => new WorkJobResource($workJob),
        ], 201);
    }

    public function update(Request $request, WorkJob $workJob, WorkJobCharge $charge): JsonResponse
    {
        $this->abortIfWorker($request, 'Workers cannot update work job charges.');
        $this->abortIfChargeDoesNotBelongToWorkJob($workJob, $charge);

        $workJob = $this->charges->update($charge, $this->validated($request, updating: true), $request->user());

        return response()->json([
            'message' => 'Work job charge updated successfully.',
            'data' => new WorkJobResource($workJob),
        ]);
    }

    public function cancel(Request $request, WorkJob $workJob, WorkJobCharge $charge): JsonResponse
    {
        $this->abortIfWorker($request, 'Workers cannot cancel work job charges.');
        $this->abortIfChargeDoesNotBelongToWorkJob($workJob, $charge);

        $data = $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $workJob = $this->charges->cancel($charge, $data['remarks'] ?? null, $request->user());

        return response()->json([
            'message' => 'Work job charge cancelled successfully.',
            'data' => new WorkJobResource($workJob),
        ]);
    }

    private function validated(Request $request, bool $updating = false): array
    {
        return $request->validate([
            'title' => [$updating ? 'sometimes' : 'required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'type' => [$updating ? 'sometimes' : 'required', Rule::enum(WorkJobChargeType::class)],
            'status' => ['sometimes', Rule::enum(WorkJobChargeStatus::class)],
            'amount' => [$updating ? 'sometimes' : 'required', 'numeric', 'min:0.01', 'max:99999999.99'],
            'requires_customer_approval' => ['sometimes', 'boolean'],
        ]);
    }

    private function abortIfChargeDoesNotBelongToWorkJob(WorkJob $workJob, WorkJobCharge $charge): void
    {
        abort_unless((int) $charge->work_job_id === (int) $workJob->id, 404);
    }
}
