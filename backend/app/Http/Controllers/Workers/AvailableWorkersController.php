<?php

namespace App\Http\Controllers\Workers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workers\AvailableWorkersRequest;
use App\Http\Resources\WorkerResource;
use App\Services\WorkerService;

class AvailableWorkersController extends Controller
{
    public function __construct(
        private readonly WorkerService $workerService
    ) {}

    public function __invoke(AvailableWorkersRequest $request)
    {
        $workers = $this->workerService->getAvailable(
            date: $request->appointment_date,
            from: $request->appointment_time_from,
            to: $request->appointment_time_until,
            excludeAppointmentId: $request->appointment_id,
        );

        return WorkerResource::collection($workers);
    }
}
