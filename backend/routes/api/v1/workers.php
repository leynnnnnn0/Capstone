<?php

use App\Http\Controllers\Workers\AvailableWorkersController;
use Illuminate\Support\Facades\Route;

Route::prefix('workers')->group(function () {
    Route::get('/available', AvailableWorkersController::class);
});
