<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Appointment;
use App\Models\WorkJob;
use Illuminate\Http\Request;

trait AuthorizesAssignedWork
{
    protected function abortIfWorkerNotAssignedToAppointment(Request $request, Appointment $appointment): void
    {
        $user = $request->user();

        if (! $user?->isWorker() || $user->isOperationsAdmin()) {
            return;
        }

        abort_unless(
            $appointment->workers()->whereKey($user->id)->exists(),
            403,
            'This appointment is not assigned to you.'
        );
    }

    protected function abortIfWorkerNotAssignedToWorkJob(Request $request, WorkJob $workJob): void
    {
        $user = $request->user();

        if (! $user?->isWorker() || $user->isOperationsAdmin()) {
            return;
        }

        abort_unless(
            $workJob->workers()->whereKey($user->id)->exists(),
            403,
            'This work job is not assigned to you.'
        );
    }

    protected function abortIfWorker(Request $request, string $message = 'Workers cannot perform this action.'): void
    {
        $user = $request->user();

        if ($user?->isWorker() && ! $user->isOperationsAdmin()) {
            abort(403, $message);
        }
    }
}
