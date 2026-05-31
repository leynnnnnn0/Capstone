<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;

class LogoutResponse implements LogoutResponseContract
{
    public function toResponse($request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()
            ->json(['status' => true, 'message' => 'Logged out'])
            ->cookie(
                'auth_token',
                '',
                -1,  // expire immediately
                '/',
                config('session.domain'),
                env('APP_ENV') === 'production',
                true,
                false,
                'Lax'
            )
            ->cookie(
                'user_role',
                '',
                -1,
                '/',
                config('session.domain'),
                env('APP_ENV') === 'production',
                false,
                false,
                'Lax'
            );
    }
}
