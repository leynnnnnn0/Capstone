<?php

namespace App\Http\Controllers\Customer;

use App\Enums\AppointmentStatus;
use App\Events\AppointmentUpdated;
use App\Exceptions\SlotFullException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointments\CancelAppointmentRequest;
use App\Http\Requests\Customer\StoreCustomerAppointmentRequest;
use App\Http\Requests\Customer\UpdateCustomerAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use App\Services\Customer\CustomerRecordAccess;
use App\Services\QuotationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class CustomerAppointmentController extends Controller
{
    private const APPOINTMENT_RELATIONS = [
        'quotation.quotation_items.options',
        'quotation.quotation_items.before_images',
        'quotation.quotation_items.after_images',
        'workers',
        'remarks.user',
    ];

    public function __construct(
        private readonly AppointmentService $appointmentService,
        private readonly CustomerRecordAccess $recordAccess,
        private readonly QuotationService $quotationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $appointments = $this->recordAccess
            ->appointmentsFor($request->user())
            ->with(self::APPOINTMENT_RELATIONS)
            ->latest()
            ->get();

        return response()->json(['data' => AppointmentResource::collection($appointments)]);
    }

    public function store(StoreCustomerAppointmentRequest $request): JsonResponse
    {
        $user = $request->user();
        $payload = [
            ...$request->validated(),
            'user_id' => $user->id,
            'email' => $request->validated('email') ?: $user->email,
            'phone_number' => $request->validated('phone_number') ?: $user->phone_number,
        ];

        try {
            $appointment = $this->appointmentService->create($payload, $user)
                ->load(self::APPOINTMENT_RELATIONS);

            return response()->json([
                'message' => 'Appointment successfully created.',
                'data' => new AppointmentResource($appointment),
            ], 201);
        } catch (SlotFullException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function show(Request $request, Appointment $appointment): JsonResponse
    {
        abort_unless($this->recordAccess->canAccessAppointment($request->user(), $appointment), 404);

        $appointment->load(self::APPOINTMENT_RELATIONS);

        return response()->json(['data' => new AppointmentResource($appointment)]);
    }

    public function update(UpdateCustomerAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        abort_unless($this->recordAccess->canAccessAppointment($request->user(), $appointment), 404);

        if ($appointment->status !== AppointmentStatus::Pending) {
            return response()->json([
                'message' => 'Only pending appointments can be edited.',
            ], 422);
        }

        $appointment = DB::transaction(function () use ($appointment, $request) {
            $validated = $request->validated();

            $appointment->update(Arr::except($validated, ['items']));

            if (!empty($validated['items'])) {
                if ($appointment->quotation) {
                    $this->quotationService->update($appointment->quotation, [
                        'items' => $validated['items'],
                    ], $request->user());
                } else {
                    $this->quotationService->create([
                        'appointment_id' => $appointment->id,
                        'items' => $validated['items'],
                    ], $request->user());
                }
            }

            return $appointment->fresh(self::APPOINTMENT_RELATIONS);
        });

        AppointmentUpdated::dispatch(
            $appointment,
            'Customer updated appointment details.',
            $request->user()
        );

        return response()->json(['data' => new AppointmentResource($appointment)]);
    }

    public function cancel(CancelAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        abort_unless($this->recordAccess->canAccessAppointment($request->user(), $appointment), 404);

        $appointment = $this->appointmentService
            ->cancel($appointment, $request->validated(), $request->user())
            ->load(self::APPOINTMENT_RELATIONS);

        return response()->json([
            'message' => 'Appointment cancelled.',
            'data' => new AppointmentResource($appointment),
        ]);
    }
}
