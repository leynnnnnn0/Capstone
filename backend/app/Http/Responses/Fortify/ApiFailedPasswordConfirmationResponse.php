<?php

namespace App\Http\Responses\Fortify;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\FailedPasswordConfirmationResponse;

class ApiFailedPasswordConfirmationResponse implements FailedPasswordConfirmationResponse
{
    public function toResponse($request): JsonResponse
    {
        return response()->json([
            'message' => 'The provided password is incorrect.',
            'errors' => [
                'password' => ['The provided password is incorrect.'],
            ],
        ], 422);
    }
}
