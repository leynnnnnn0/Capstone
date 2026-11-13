<?php

use App\Http\Controllers\Audits\AuditController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:admin|owner'])->group(function () {
    Route::get('audits', [AuditController::class, 'index']);
    Route::get('audits/{audit}', [AuditController::class, 'show']);
});
