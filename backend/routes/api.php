<?php

use App\Http\Controllers\Appointments\AppointmentController;
use App\Http\Controllers\Appointments\CancelAppointmentController;
use App\Http\Controllers\Appointments\ConfirmAppointmentController;
use App\Http\Controllers\Appointments\MarkCompletedController;
use App\Http\Controllers\Appointments\MarkInProgressController;
use App\Http\Controllers\Appointments\MarkOnTheWayController;
use App\Http\Controllers\Appointments\RescheduleAppointmentController;
use App\Http\Controllers\Categories\CategoryController;
use App\Http\Controllers\Products\ProductController;
use App\Http\Controllers\Products\ProductImageController;
use App\Http\Controllers\Workers\AvailableWorkersController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController;
use Laravel\Fortify\Http\Controllers\NewPasswordController;

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->middleware('throttle:6,1');

Route::post('/reset-password', [NewPasswordController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('password.reset');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:login');

Route::post('/register', [RegisteredUserController::class, 'store'])
    ->middleware('throttle:register');

Route::prefix('appointments')->group(function () {
    Route::post('/', [AppointmentController::class, 'store']);

    Route::patch('{appointment}/confirm',     ConfirmAppointmentController::class);
    Route::patch('{appointment}/cancel',      CancelAppointmentController::class);
    Route::patch('{appointment}/reschedule',  RescheduleAppointmentController::class);
    Route::patch('{appointment}/on-the-way',  MarkOnTheWayController::class);
    Route::patch('{appointment}/in-progress', MarkInProgressController::class);
    Route::patch('{appointment}/complete',    MarkCompletedController::class);
}); 

Route::prefix('v1')->group(function(){
    Route::apiResource('products', ProductController::class);

    Route::post('products/{product}/images',           [ProductImageController::class, 'store']);
    Route::delete('products/{product}/images/{image}', [ProductImageController::class, 'destroy']);
});

Route::prefix('v1')->group(function (){
    Route::apiResource('categories', CategoryController::class);
});

Route::prefix('workers')->group(function () {
    Route::get('/available', AvailableWorkersController::class);
}); 

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function(Request $request) {
        return response()->json($request->user());
    });

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
});


Route::prefix('v1')->group(function () {
    require __DIR__ . '/api/v1/quotations.php';
    require __DIR__ . '/api/v1/work_jobs.php';
});

