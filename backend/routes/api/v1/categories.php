<?php

use App\Http\Controllers\Categories\CategoryController;
use Illuminate\Support\Facades\Route;

Route::apiResource('categories', CategoryController::class);
