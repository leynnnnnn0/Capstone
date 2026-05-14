<?php

use App\Http\Controllers\Appointments\AppointmentController;
use App\Http\Controllers\Appointments\CancelAppointmentController;
use App\Http\Controllers\Appointments\ConfirmAppointmentController;
use App\Http\Controllers\Appointments\MarkCompletedController;
use App\Http\Controllers\Appointments\MarkInProgressController;
use App\Http\Controllers\Appointments\MarkOnTheWayController;
use App\Http\Controllers\Appointments\RescheduleAppointmentController;
use Illuminate\Support\Facades\Route;

Route::prefix('appointments')->group(function () {
    Route::get('/', [AppointmentController::class, 'index']);
    Route::post('/', [AppointmentController::class, 'store']);
    Route::get('{appointment}', [AppointmentController::class, 'show']);

    Route::patch('{appointment}/confirm', ConfirmAppointmentController::class);
    Route::patch('{appointment}/cancel', CancelAppointmentController::class);
    Route::patch('{appointment}/reschedule', RescheduleAppointmentController::class);
    Route::patch('{appointment}/on-the-way', MarkOnTheWayController::class);
    Route::patch('{appointment}/in-progress', MarkInProgressController::class);
    Route::patch('{appointment}/complete', MarkCompletedController::class);
});
