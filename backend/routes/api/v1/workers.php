<?php

use App\Http\Controllers\Workers\AvailableWorkersController;
use App\Http\Resources\WorkerResource;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'account.role:admin,sub_admin,staff'])->prefix('workers')->group(function () {
    Route::get('/', fn () => WorkerResource::collection(
        User::query()
            ->where(fn ($query) => $query
                ->whereIn('role', ['staff', 'admin'])
                ->orWhereHas('roles', fn ($query) => $query->whereIn('name', ['staff', 'admin']))
            )
            ->orderBy('first_name')
            ->get()
    ));
    Route::get('/available', AvailableWorkersController::class);
});
