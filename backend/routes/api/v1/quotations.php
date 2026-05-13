<?php

use App\Http\Controllers\Quotations\QuotationController;
use App\Http\Controllers\Quotations\QuotationItemStatusController;
use Illuminate\Support\Facades\Route;

Route::get('quotations/{quotation}', [QuotationController::class, 'show']);
Route::post('quotations', [QuotationController::class, 'store']);
Route::put('quotations/{quotation}', [QuotationController::class, 'update']);

Route::patch(
    'quotation-items/{quotationItem}/status',
    QuotationItemStatusController::class
);
