<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        return new JsonResponse([
            'message' => 'Registration successful',
            'user' => [
                'id'       => $user->id,
                'username' => $user->username,
                'email'    => $user->email,
            ],
        ], 201);
    }
}
