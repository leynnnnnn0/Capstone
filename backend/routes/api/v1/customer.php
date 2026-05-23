<?php

use App\Http\Controllers\Customer\CustomerAppointmentController;
use App\Http\Controllers\Customer\CustomerPayPalConfigController;
use App\Http\Controllers\Customer\CustomerQuotationSignatureController;
use App\Http\Controllers\Customer\CustomerWorkJobController;
use App\Http\Controllers\Customer\CustomerWorkJobPaymentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('customer')->group(function () {
    Route::get('/appointments', [CustomerAppointmentController::class, 'index']);
    Route::post('/appointments', [CustomerAppointmentController::class, 'store']);
    Route::get('/appointments/{appointment}', [CustomerAppointmentController::class, 'show']);
    Route::put('/appointments/{appointment}', [CustomerAppointmentController::class, 'update']);
    Route::patch('/appointments/{appointment}/cancel', [CustomerAppointmentController::class, 'cancel']);

    Route::get('/work-jobs', [CustomerWorkJobController::class, 'index']);
    Route::get('/work-jobs/{workJob}', [CustomerWorkJobController::class, 'show']);
    Route::get('/payments/paypal/config', CustomerPayPalConfigController::class);
    Route::post('/work-jobs/{workJob}/payments/paypal/order', [CustomerWorkJobPaymentController::class, 'createOrder']);
    Route::post('/work-jobs/{workJob}/payments/paypal/capture', [CustomerWorkJobPaymentController::class, 'capture']);

    Route::post('/quotations/{quotation}/sign', [CustomerQuotationSignatureController::class, 'store']);
});
