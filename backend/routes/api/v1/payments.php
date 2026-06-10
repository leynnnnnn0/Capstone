<?php

use App\Http\Controllers\Payments\PaymentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'account.role:admin,sub_admin'])->group(function () {
    Route::get('payments', [PaymentController::class, 'index']);
    Route::post('payments/{payment}/refund', [PaymentController::class, 'refund']);
});
