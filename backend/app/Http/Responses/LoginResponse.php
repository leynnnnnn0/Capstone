<?php


namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();
        $remember = $request->boolean('remember');
        $minutes = $remember ? 60 * 2 : 60;
        $expiresAt = $remember ? now()->addHours(2) : now()->addHour();

        $token = $user->createToken('auth-token', ['*'], $expiresAt)->plainTextToken;
        $response = ['user' => $user->only('id', 'username', 'email')];
        if (env('APP_ENV') !== 'production') {
            $response['token'] = $token;
        }

        return response()
            ->json($response)
            ->cookie(
                'auth_token',
                $token,
                $minutes,
                '/',
                env('SESSION_DOMAIN', ''),
                env('APP_ENV') === 'production',
                true,
                false,
                'Lax'
            );
    }
}