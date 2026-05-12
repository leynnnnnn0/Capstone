<?php

namespace App\Http\Controllers\Appointments;

use App\Http\Controllers\Controller;
use App\Exceptions\InvalidStatusTransitionException;
use App\Http\Requests\ConfirmAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Support\Facades\Log;
use Throwable;

class ConfirmAppointmentController extends Controller
{
    public function __construct(
        private readonly AppointmentService $appointmentService
    ) {}

    public function __invoke(
        ConfirmAppointmentRequest $request,
        Appointment $appointment
    ) {
        try {
            $appointment = $this->appointmentService->confirm(
                $appointment,
                $request->validated(),
                $request->user()
            );

            return response()->json([
                'message' => 'Appointment successfully confirmed.',
                'data'    => new AppointmentResource($appointment),
            ], 200);

        } catch (InvalidStatusTransitionException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (Throwable $e) {
            Log::error('Failed to confirm appointment', [
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
