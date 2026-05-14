<?php

namespace App\Http\Controllers\Appointments;

use App\Exceptions\InvalidStatusTransitionException;
use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class MarkOnTheWayController extends Controller
{
    public function __construct(
        private readonly AppointmentService $appointmentService
    ) {}

    public function __invoke(Request $request, Appointment $appointment)
    {
        try {
            $appointment = $this->appointmentService->markOnTheWay(
                $appointment,
                $request->user()
            )->load([
                'quotation.quotation_items.options',
                'quotation.quotation_items.before_images',
                'quotation.quotation_items.after_images',
                'workers',
                'remarks.user',
            ]);

            return response()->json([
                'message' => 'Appointment marked as on the way.',
                'data'    => new AppointmentResource($appointment),
            ]);
        } catch (InvalidStatusTransitionException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('Failed to mark appointment on the way', [
                'appointment_id' => $appointment->id,
                'error'          => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Something went wrong.',
            ], 500);
        }
    }
}
