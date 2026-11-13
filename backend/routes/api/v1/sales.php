<?php

use App\Http\Controllers\Reports\SalesReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'account.role:admin,owner'])->group(function () {
    Route::get('sales', SalesReportController::class);
    Route::get('sales/export/{format}', [SalesReportController::class, 'export'])
        ->whereIn('format', ['csv', 'xlsx', 'pdf']);
});
