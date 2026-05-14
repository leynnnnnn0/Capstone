<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\WorkJobResource;
use App\Models\WorkJob;
use App\Services\Customer\CustomerRecordAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerWorkJobController extends Controller
{
    private const WORK_JOB_RELATIONS = [
        'workers',
        'appointment.workers',
        'appointment.remarks.user',
        'appointment.quotation.quotation_items.options',
        'appointment.quotation.quotation_items.before_images',
        'appointment.quotation.quotation_items.after_images',
        'quotation.quotation_items.options',
        'quotation.quotation_items.before_images',
        'quotation.quotation_items.after_images',
    ];

    public function __construct(private readonly CustomerRecordAccess $recordAccess) {}

    public function index(Request $request): JsonResponse
    {
        $workJobs = $this->recordAccess
            ->workJobsFor($request->user())
            ->with(self::WORK_JOB_RELATIONS)
            ->latest()
            ->get();

        return response()->json(['data' => WorkJobResource::collection($workJobs)]);
    }

    public function show(Request $request, WorkJob $workJob): JsonResponse
    {
        abort_unless($this->recordAccess->canAccessWorkJob($request->user(), $workJob), 404);

        $workJob->load(self::WORK_JOB_RELATIONS);

        return response()->json(['data' => new WorkJobResource($workJob)]);
    }
}
