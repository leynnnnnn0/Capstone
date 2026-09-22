<?php

use App\Http\Controllers\Database\DatabaseBackupController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:admin', 'permission:database.manage', 'password.confirmed'])
    ->prefix('database/backups')
    ->group(function () {
        Route::get('/', [DatabaseBackupController::class, 'index']);
        Route::post('/', [DatabaseBackupController::class, 'store']);
        Route::get('{backup}/download', [DatabaseBackupController::class, 'download']);
        Route::post('{backup}/restore', [DatabaseBackupController::class, 'restore']);
    });
