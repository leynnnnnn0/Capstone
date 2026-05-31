<?php

use App\Http\Controllers\Products\ProductController;
use App\Http\Controllers\Products\Product3DModelFileController;
use App\Http\Controllers\Products\ProductImageController;
use Illuminate\Support\Facades\Route;

// Product CRUD powers the public catalog, quote builder, admin product manager,
// and AR product catalog. The controller returns ProductResource so URLs and
// nested product data are normalized in one place.
Route::apiResource('products', ProductController::class);

// 3D model files are streamed through a controller instead of exposing raw disk
// paths. This lets the frontend/model-viewer/AR request GLB files consistently.
Route::get('product-3d-models/{product3DModel}/file', Product3DModelFileController::class)
    ->name('api.v1.product-3d-models.file');

// Product images are managed separately from product update because image upload
// and delete are common admin actions and need their own storage cleanup.
Route::post('products/{product}/images', [ProductImageController::class, 'store']);
Route::delete('products/{product}/images/{image}', [ProductImageController::class, 'destroy']);
