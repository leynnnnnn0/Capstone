<?php

use App\Http\Controllers\ArMeasurements\ArMeasurementSessionController;
use App\Http\Controllers\ArMeasurements\ReviewArMeasurementSessionController;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'auth:sanctum',
    'account.role:admin,sub_admin,worker,customer',
])->group(function () {
    Route::post('/ar-measurement-sessions', [
        ArMeasurementSessionController::class,
        'store',
    ]);
    Route::get('/ar-measurement-sessions/{arMeasurementSession}/summary', [
        ArMeasurementSessionController::class,
        'summary',
    ]);
    Route::get('/ar-measurement-sessions/{arMeasurementSession}', [
        ArMeasurementSessionController::class,
        'show',
    ]);
});

Route::middleware([
    'auth:sanctum',
    'account.role:admin,sub_admin,worker',
])->group(function () {
    Route::get('/appointments/{appointment}/measurement-sessions', [
        ArMeasurementSessionController::class,
        'indexForAppointment',
    ]);
    Route::patch('/ar-measurement-sessions/{arMeasurementSession}/review', [
        ReviewArMeasurementSessionController::class,
        '__invoke',
    ]);
});

Route::middleware([
    'auth:sanctum',
    'account.role:customer',
])->get('/customer/appointments/{appointment}/measurement-sessions', [
    ArMeasurementSessionController::class,
    'indexForAppointment',
]);
