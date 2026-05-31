<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

// Realtime notification channels are protected by Sanctum so only logged-in
// users can subscribe to private dashboard/customer events.
Broadcast::routes(['middleware' => ['auth:sanctum']]);

// Auth routes are split out because they are used before the versioned business
// API: login/logout, customer OTP login, and the current-user endpoint.
require __DIR__ . '/api/auth.php';
require __DIR__ . '/api/customer_auth.php';
require __DIR__ . '/api/user.php';

// All business endpoints live under /api/v1. Each file owns one bounded area of
// the system so controller/service changes stay easy to find.
Route::prefix('v1')->group(function () {
    require __DIR__ . '/api/v1/appointments.php';
    require __DIR__ . '/api/v1/audits.php';
    require __DIR__ . '/api/v1/categories.php';
    require __DIR__ . '/api/v1/customer.php';
    require __DIR__ . '/api/v1/notifications.php';
    require __DIR__ . '/api/v1/payments.php';
    require __DIR__ . '/api/v1/products.php';
    require __DIR__ . '/api/v1/quotations.php';
    require __DIR__ . '/api/v1/sales.php';
    require __DIR__ . '/api/v1/tracking.php';
    require __DIR__ . '/api/v1/users.php';
    require __DIR__ . '/api/v1/work_jobs.php';
    require __DIR__ . '/api/v1/workers.php';
});
