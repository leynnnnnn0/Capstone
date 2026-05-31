<?php


namespace App\Http\Responses;

use App\Http\Resources\UserResource;
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
        $user->load('roles', 'permissions');
        $role = $user->getRoleNames()->first() ?? $user->role;
        $response = ['user' => UserResource::make($user)];
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
                config('session.domain'),
                env('APP_ENV') === 'production',
                true,
                false,
                'Lax'
            )
            ->cookie(
                'user_role',
                $role,
                $minutes,
                '/',
                config('session.domain'),
                env('APP_ENV') === 'production',
                false,
                false,
                'Lax'
            );
    }
}
