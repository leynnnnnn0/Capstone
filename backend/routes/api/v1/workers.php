<?php

use App\Http\Controllers\Workers\AvailableWorkersController;
use App\Models\User;
use App\Http\Resources\WorkerResource;
use Illuminate\Support\Facades\Route;

Route::prefix('workers')->group(function () {
    Route::get('/', fn () => WorkerResource::collection(User::whereIn('role', ['worker', 'admin'])->orderBy('first_name')->get()));
    Route::get('/available', AvailableWorkersController::class);
});
