<?php

namespace App\Http\Controllers\Appointments;

use App\Exceptions\InvalidStatusTransitionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointments\RescheduleAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Support\Facades\Log;
use Throwable;

class RescheduleAppointmentController extends Controller
{
    public function __construct(
        private readonly AppointmentService $appointmentService
    ) {}

    public function __invoke(
        RescheduleAppointmentRequest $request,
        Appointment $appointment
    ) {
        try {
            $appointment = $this->appointmentService->reschedule(
                $appointment,
                $request->validated(),
                $request->user()
            );

            return response()->json([
                'message' => 'Appointment rescheduled.',
                'data'    => new AppointmentResource($appointment),
            ]);
        } catch (InvalidStatusTransitionException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('Failed to reschedule appointment', [
                'appointment_id' => $appointment->id,
                'error'          => $e->getMessage(),
                'trace'          => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while rescheduling the appointment.',
            ], 500);
        }
    }
}
