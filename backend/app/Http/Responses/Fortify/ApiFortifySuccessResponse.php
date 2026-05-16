<?php

namespace App\Http\Responses\Fortify;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\PasswordConfirmedResponse;
use Laravel\Fortify\Contracts\PasswordUpdateResponse;
use Laravel\Fortify\Contracts\ProfileInformationUpdatedResponse;
use Laravel\Fortify\Contracts\RecoveryCodesGeneratedResponse;
use Laravel\Fortify\Contracts\TwoFactorConfirmedResponse;
use Laravel\Fortify\Contracts\TwoFactorDisabledResponse;
use Laravel\Fortify\Contracts\TwoFactorEnabledResponse;

class ApiFortifySuccessResponse implements
    PasswordConfirmedResponse,
    PasswordUpdateResponse,
    ProfileInformationUpdatedResponse,
    RecoveryCodesGeneratedResponse,
    TwoFactorConfirmedResponse,
    TwoFactorDisabledResponse,
    TwoFactorEnabledResponse
{
    public function toResponse($request): JsonResponse
    {
        return response()->json([
            'status' => true,
            'message' => 'Action completed successfully.',
        ]);
    }
}
