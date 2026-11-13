<?php

use App\Http\Controllers\Categories\CategoryController;
use Illuminate\Support\Facades\Route;

Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);

Route::middleware(['auth:sanctum', 'account.role:admin,owner'])->group(function () {
    Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);
});
