<?php

namespace App\Http\Controllers\Appointments;

use App\Exceptions\SlotFullException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Resources\QuotationResource;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class AppointmentController extends Controller
{
    public function __construct(
        private readonly AppointmentService $appointmentService
    ) {}

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        try {
            $appointment = $this->appointmentService->create($request->validated());

            $appointment->load('quotation.quotation_items');

            return response()->json([
                'message' => 'Appointment successfully created.',
                'data'    => [
                    'id'                 => $appointment->id,
                    'appointment_number' => $appointment->appointment_number,
                    'status'             => $appointment->status,
                    'has_quotation'      => $appointment->quotation !== null,
                    'quotation'          => $appointment->quotation
                        ? new QuotationResource($appointment->quotation)
                        : null,
                ],
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
                'message' => 'Something went wrong while creating your appointment.',
            ], 500);
        }
    }
}
