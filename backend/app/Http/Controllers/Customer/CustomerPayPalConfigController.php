<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Services\Payments\PayPalClient;
use Illuminate\Http\JsonResponse;

class CustomerPayPalConfigController extends Controller
{
    public function __invoke(PayPalClient $payPal): JsonResponse
    {
        return response()->json([
            'enabled' => $payPal->configured(),
            'client_id' => $payPal->configured() ? $payPal->clientId() : null,
            'currency' => $payPal->currency(),
            'mode' => $payPal->mode(),
        ]);
    }
}
