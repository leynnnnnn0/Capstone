<?php

namespace App\Http\Controllers\WorkJobs;

use App\Http\Controllers\Controller;
use App\Http\Requests\WorkJobs\StoreWorkJobRequest;
use App\Http\Resources\WorkJobResource;
use App\Models\Appointment;
use App\Models\WorkJob;
use App\Services\WorkJobService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class WorkJobController extends Controller
{
    public function __construct(
        private readonly WorkJobService $workJobService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['work_job_number', 'first_name', 'scheduled_date', 'status'];
        $sortBy  = in_array($request->sort_by, $allowedSorts) ? $request->sort_by : 'scheduled_date';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';

        $workJobs = WorkJob::query()
            ->with(['workers', 'appointment', 'quotation'])
            ->when(
                $request->search,
                fn($q) =>
                $q->where(
                    fn($q) =>
                    $q->where('first_name',      'like', "%{$request->search}%")
                        ->orWhere('last_name',      'like', "%{$request->search}%")
                        ->orWhere('phone_number',   'like', "%{$request->search}%")
                        ->orWhere('work_job_number', 'like', "%{$request->search}%")
                )
            )
            ->when(
                $request->status && $request->status !== 'all',
                fn($q) =>
                $q->where('status', $request->status)
            )
            ->when(
                $request->date_from,
                fn($q) =>
                $q->whereDate('scheduled_date', '>=', $request->date_from)
            )
            ->when(
                $request->date_to,
                fn($q) =>
                $q->whereDate('scheduled_date', '<=', $request->date_to)
            )
            ->orderBy($sortBy, $sortDir)
            ->paginate($request->per_page ?? 15);

        return response()->json(WorkJobResource::collection($workJobs));
    }

    public function store(StoreWorkJobRequest $request): JsonResponse
    {
        try {
            $workJob = $this->workJobService->create($request->validated());

            return response()->json([
                'message' => 'Work job created successfully.',
                'data'    => new WorkJobResource($workJob),
            ], 201);
        } catch (Throwable $e) {
            Log::error('Failed to create work job', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while creating the work job.',
            ], 500);
        }
    }

    public function show(WorkJob $workJob): JsonResponse
    {
        $workJob->load([
            'workers',
            'appointment',
            'quotation.quotation_items.options',
            'quotation.quotation_items.before_images',
            'quotation.quotation_items.after_images',
            'remarks.user',
        ]);

        return response()->json([
            'data' => new WorkJobResource($workJob),
        ]);
    }

    public function createFromAppointment(Appointment $appointment): JsonResponse
    {
        try {
            $workJob = $this->workJobService->createFromAppointment($appointment);

            return response()->json([
                'message' => 'Work job created from appointment successfully.',
                'data'    => new WorkJobResource($workJob),
            ], 201);
        } catch (Throwable $e) {
            Log::error('Failed to create work job from appointment', [
                'appointment_id' => $appointment->id,
                'error'          => $e->getMessage(),
                'trace'          => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while creating the work job.',
            ], 500);
        }
    }
}
