<?php

namespace App\Http\Controllers\CustomerAuth;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerAuth\RequestCustomerOtpRequest;
use App\Services\CustomerAuth\CustomerOtpService;

class RequestCustomerOtpController extends Controller
{
    public function __invoke(
        RequestCustomerOtpRequest $request,
        CustomerOtpService $otpService
    ) {
        return response()->json([
            'message' => 'We sent your one-time code.',
            'data' => $otpService->requestCode($request->validated('contact'), $request),
        ]);
    }
}
