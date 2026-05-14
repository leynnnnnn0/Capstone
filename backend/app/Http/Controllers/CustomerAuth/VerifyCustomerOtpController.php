<?php

namespace App\Http\Controllers\CustomerAuth;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerAuth\VerifyCustomerOtpRequest;
use App\Services\CustomerAuth\CustomerOtpService;

class VerifyCustomerOtpController extends Controller
{
    public function __invoke(
        VerifyCustomerOtpRequest $request,
        CustomerOtpService $otpService
    ) {
        $validated = $request->validated();
        $user = $otpService->verifyCode($validated['contact'], $validated['code']);
        $sessionMinutes = 60 * 24 * 14;
        $expiresAt = now()->addDays(14);
        $token = $user->createToken('auth-token', ['*'], $expiresAt)->plainTextToken;

        $response = [
            'user' => $user->only('id', 'username', 'first_name', 'last_name', 'email', 'phone_number', 'role'),
        ];

        if (app()->environment() !== 'production') {
            $response['token'] = $token;
        }

        return response()
            ->json($response)
            ->cookie(
                'auth_token',
                $token,
                $sessionMinutes,
                '/',
                env('SESSION_DOMAIN', ''),
                app()->environment('production'),
                true,
                false,
                'Lax'
            )
            ->cookie(
                'user_role',
                $user->role,
                $sessionMinutes,
                '/',
                env('SESSION_DOMAIN', ''),
                app()->environment('production'),
                false,
                false,
                'Lax'
            );
    }
}
