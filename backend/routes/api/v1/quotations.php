<?php

use App\Http\Controllers\Quotations\QuotationController;
use App\Http\Controllers\Quotations\QuotationItemImageController;
use App\Http\Controllers\Quotations\QuotationItemStatusController;
use App\Http\Controllers\Quotations\QuotationPdfController;
use Illuminate\Support\Facades\Route;

Route::get('quotations/{quotation}', [QuotationController::class, 'show']);
Route::get('quotations/{quotation}/pdf', QuotationPdfController::class);
Route::post('quotations', [QuotationController::class, 'store']);
Route::put('quotations/{quotation}', [QuotationController::class, 'update']);

Route::patch(
    'quotation-items/{quotationItem}/status',
    QuotationItemStatusController::class
);

Route::post('quotation-items/{quotationItem}/images', [QuotationItemImageController::class, 'store']);
Route::delete('quotation-item-images/{quotationItemImage}', [QuotationItemImageController::class, 'destroy']);
