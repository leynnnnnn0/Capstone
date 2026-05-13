<?php

use App\Http\Controllers\Products\ProductController;
use App\Http\Controllers\Products\ProductImageController;
use Illuminate\Support\Facades\Route;

Route::apiResource('products', ProductController::class);

Route::post('products/{product}/images', [ProductImageController::class, 'store']);
Route::delete('products/{product}/images/{image}', [ProductImageController::class, 'destroy']);
