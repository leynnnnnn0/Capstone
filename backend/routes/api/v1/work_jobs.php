<?php

use App\Http\Controllers\WorkJobs\CancelWorkJobController;
use App\Http\Controllers\WorkJobs\CompleteWorkJobController;
use App\Http\Controllers\WorkJobs\ConfirmWorkJobController;
use App\Http\Controllers\WorkJobs\CreateBackJobController;
use App\Http\Controllers\WorkJobs\MarkInProgressController;
use App\Http\Controllers\WorkJobs\MarkNoShowController;
use App\Http\Controllers\WorkJobs\MarkOnTheWayController;
use App\Http\Controllers\WorkJobs\RecordWorkJobPaymentController;
use App\Http\Controllers\WorkJobs\ReopenWorkJobController;
use App\Http\Controllers\WorkJobs\RescheduleWorkJobController;
use App\Http\Controllers\WorkJobs\WorkJobChargeController;
use App\Http\Controllers\WorkJobs\WorkJobController;
use App\Http\Controllers\WorkJobs\UpdateWorkJobFabricationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'account.role:admin,sub_admin,worker'])->group(function () {
    Route::get('work-jobs', [WorkJobController::class, 'index']);
    Route::get('work-jobs/{workJob}', [WorkJobController::class, 'show']);
    Route::post('work-jobs', [WorkJobController::class, 'store']);
    Route::patch('work-jobs/{workJob}', [WorkJobController::class, 'update']);
    Route::patch('work-jobs/{workJob}/fabrication', UpdateWorkJobFabricationController::class);

    Route::post(
        'appointments/{appointment}/work-job',
        [WorkJobController::class, 'createFromAppointment']
    );

    Route::patch('work-jobs/{workJob}/confirm', ConfirmWorkJobController::class);
    Route::patch('work-jobs/{workJob}/reschedule', RescheduleWorkJobController::class);
    Route::patch('work-jobs/{workJob}/on-the-way', MarkOnTheWayController::class);
    Route::patch('work-jobs/{workJob}/in-progress', MarkInProgressController::class);
    Route::patch('work-jobs/{workJob}/complete', CompleteWorkJobController::class);
    Route::patch('work-jobs/{workJob}/cancel', CancelWorkJobController::class);
    Route::patch('work-jobs/{workJob}/reopen', ReopenWorkJobController::class);
    Route::patch('work-jobs/{workJob}/no-show', MarkNoShowController::class);
    Route::post('work-jobs/{workJob}/back-jobs', CreateBackJobController::class);
    Route::post('work-jobs/{workJob}/payments/manual', RecordWorkJobPaymentController::class);
    Route::post('work-jobs/{workJob}/charges', [WorkJobChargeController::class, 'store']);
    Route::patch('work-jobs/{workJob}/charges/{charge}', [WorkJobChargeController::class, 'update']);
    Route::patch('work-jobs/{workJob}/charges/{charge}/cancel', [WorkJobChargeController::class, 'cancel']);
});
