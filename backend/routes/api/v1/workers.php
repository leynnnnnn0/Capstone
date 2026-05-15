<?php

use App\Http\Controllers\Workers\AvailableWorkersController;
use App\Models\User;
use App\Http\Resources\WorkerResource;
use Illuminate\Support\Facades\Route;

Route::prefix('workers')->group(function () {
    Route::get('/', fn () => WorkerResource::collection(
        User::query()
            ->where(fn ($query) => $query
                ->whereIn('role', ['worker', 'admin'])
                ->orWhereHas('roles', fn ($query) => $query->whereIn('name', ['worker', 'admin']))
            )
            ->orderBy('first_name')
            ->get()
    ));
    Route::get('/available', AvailableWorkersController::class);
});
