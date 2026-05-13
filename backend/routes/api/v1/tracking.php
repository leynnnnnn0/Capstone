<?php

use App\Http\Controllers\Tracking\TrackingController;
use Illuminate\Support\Facades\Route;

Route::get('track', [TrackingController::class, 'show']);
