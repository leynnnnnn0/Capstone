<?php

use App\Http\Controllers\Products\ProductController;
use App\Http\Controllers\Products\Product3DModelFileController;
use App\Http\Controllers\Products\ProductImageController;
use Illuminate\Support\Facades\Route;

Route::apiResource('products', ProductController::class);
Route::get('product-3d-models/{product3DModel}/file', Product3DModelFileController::class)
    ->name('api.v1.product-3d-models.file');

Route::post('products/{product}/images', [ProductImageController::class, 'store']);
Route::delete('products/{product}/images/{image}', [ProductImageController::class, 'destroy']);
