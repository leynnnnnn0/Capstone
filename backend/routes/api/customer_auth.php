<?php

use App\Http\Controllers\CustomerAuth\RequestCustomerOtpController;
use App\Http\Controllers\CustomerAuth\VerifyCustomerOtpController;
use Illuminate\Support\Facades\Route;

Route::prefix('customer')->group(function () {
    Route::post('/request-otp', RequestCustomerOtpController::class)
        ->middleware('throttle:customer-otp-request');

    Route::post('/verify-otp', VerifyCustomerOtpController::class)
        ->middleware('throttle:customer-otp-verify');
});
