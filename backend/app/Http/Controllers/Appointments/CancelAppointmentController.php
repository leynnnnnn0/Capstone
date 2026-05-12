<?php

namespace App\Http\Controllers\Appointments;

use App\Exceptions\InvalidStatusTransitionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointments\CancelAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Support\Facades\Log;
use Throwable;

class CancelAppointmentController extends Controller
{
    public function __construct(
        private readonly AppointmentService $appointmentService
    ) {}

    public function __invoke(
        CancelAppointmentRequest $request,
        Appointment $appointment
    ) {
        try {
            $appointment = $this->appointmentService->cancel(
                $appointment,
                $request->validated(),
                $request->user()
            );

            return response()->json([
                'message' => 'Appointment cancelled.',
                'data'    => new AppointmentResource($appointment),
            ]);
        } catch (InvalidStatusTransitionException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('Failed to cancel appointment', [
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
