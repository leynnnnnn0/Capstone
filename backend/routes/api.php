<?php

use Illuminate\Support\Facades\Route;

require __DIR__ . '/api/auth.php';
require __DIR__ . '/api/customer_auth.php';
require __DIR__ . '/api/user.php';

Route::prefix('v1')->group(function () {
    require __DIR__ . '/api/v1/appointments.php';
    require __DIR__ . '/api/v1/categories.php';
    require __DIR__ . '/api/v1/customer.php';
    require __DIR__ . '/api/v1/products.php';
    require __DIR__ . '/api/v1/quotations.php';
    require __DIR__ . '/api/v1/tracking.php';
    require __DIR__ . '/api/v1/users.php';
    require __DIR__ . '/api/v1/work_jobs.php';
    require __DIR__ . '/api/v1/workers.php';
});
