<?php

use App\Http\Controllers\Notifications\NotificationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::patch('/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/{notification}', [NotificationController::class, 'destroy']);
});
