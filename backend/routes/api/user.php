<?php

use Illuminate\Http\Request;
use App\Http\Resources\UserResource;
use App\Http\Controllers\Auth\ApiAuthenticatedSessionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return UserResource::make($request->user()->load('roles', 'permissions'));
    });

    Route::post('/logout', [ApiAuthenticatedSessionController::class, 'destroy']);
});
