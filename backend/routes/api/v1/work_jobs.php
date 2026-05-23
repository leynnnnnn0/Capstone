<?php

use App\Http\Controllers\WorkJobs\CancelWorkJobController;
use App\Http\Controllers\WorkJobs\CompleteWorkJobController;
use App\Http\Controllers\WorkJobs\MarkInProgressController;
use App\Http\Controllers\WorkJobs\RecordWorkJobPaymentController;
use App\Http\Controllers\WorkJobs\WorkJobChargeController;
use App\Http\Controllers\WorkJobs\WorkJobController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('work-jobs', [WorkJobController::class, 'index']);
    Route::get('work-jobs/{workJob}', [WorkJobController::class, 'show']);
    Route::post('work-jobs', [WorkJobController::class, 'store']);

    Route::post(
        'appointments/{appointment}/work-job',
        [WorkJobController::class, 'createFromAppointment']
    );

    Route::patch('work-jobs/{workJob}/in-progress', MarkInProgressController::class);
    Route::patch('work-jobs/{workJob}/complete', CompleteWorkJobController::class);
    Route::patch('work-jobs/{workJob}/cancel', CancelWorkJobController::class);
    Route::post('work-jobs/{workJob}/payments/manual', RecordWorkJobPaymentController::class);
    Route::post('work-jobs/{workJob}/charges', [WorkJobChargeController::class, 'store']);
    Route::patch('work-jobs/{workJob}/charges/{charge}', [WorkJobChargeController::class, 'update']);
    Route::patch('work-jobs/{workJob}/charges/{charge}/cancel', [WorkJobChargeController::class, 'cancel']);
});
