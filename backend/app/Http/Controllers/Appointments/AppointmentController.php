<?php

namespace App\Http\Controllers\Appointments;

use App\Exceptions\SlotFullException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class AppointmentController extends Controller
{
    private const RELATIONS = [
        'quotation.quotation_items.options',
        'quotation.quotation_items.before_images',
        'quotation.quotation_items.after_images',
        'workers',
        'remarks.user',
    ];

    public function __construct(
        private readonly AppointmentService $appointmentService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Appointment::query()
            ->with(self::RELATIONS)
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search) {
                    $query
                        ->where('appointment_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('phone_number', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status') && $request->status !== 'all', fn ($query) => $query->where('status', $request->status))
            ->when($request->filled('service_type') && $request->service_type !== 'all', fn ($query) => $query->where('service_type', $request->service_type))
            ->when($request->filled('date_from'), fn ($query) => $query->whereDate('preferred_date', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn ($query) => $query->whereDate('preferred_date', '<=', $request->date_to));

        $sortBy = in_array($request->input('sort_by'), ['appointment_number', 'first_name', 'preferred_date', 'preferred_time', 'status', 'created_at'], true)
            ? $request->input('sort_by')
            : 'created_at';
        $sortDir = $request->input('sort_dir') === 'asc' ? 'asc' : 'desc';

        $appointments = $query
            ->orderBy($sortBy, $sortDir)
            ->paginate((int) $request->input('per_page', 10))
            ->withQueryString();

        return response()->json(AppointmentResource::collection($appointments)->response()->getData(true));
    }

    public function show(Appointment $appointment): JsonResponse
    {
        $appointment->load(self::RELATIONS);

        return response()->json([
            'data' => new AppointmentResource($appointment),
        ]);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        try {
            $appointment = $this->appointmentService->create($request->validated());

            $appointment->load(self::RELATIONS);

            return response()->json([
                'message' => 'Appointment successfully created.',
                'data'    => new AppointmentResource($appointment),
            ], 201);
        } catch (SlotFullException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('Failed to create appointment', [
                'error'   => $e->getMessage(),
                'user_id' => $request->input('user_id'),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        try {
            $appointment = $this->appointmentService->update($appointment, $request->validated(), $request->user());

            $appointment->load(self::RELATIONS);

            return response()->json([
                'message' => 'Appointment successfully updated.',
                'data'    => new AppointmentResource($appointment),
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to update appointment', [
                'appointment_id' => $appointment->id,
                'error'          => $e->getMessage(),
                'trace'          => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
