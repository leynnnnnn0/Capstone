<?php

namespace App\Services\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\TransientToken;

class PasswordConfirmationStore
{
    private const MINUTES = 15;

    public function confirm(Request $request): void
    {
        Cache::put($this->key($request), true, now()->addMinutes(self::MINUTES));
    }

    public function confirmed(Request $request): bool
    {
        return Cache::has($this->key($request));
    }

    public function forget(Request $request): void
    {
        Cache::forget($this->key($request));
    }

    public function expiresInMinutes(): int
    {
        return self::MINUTES;
    }

    private function key(Request $request): string
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();
        $tokenId = $token instanceof TransientToken ? null : $token?->getKey();
        $tokenKey = $tokenId ? "token:{$tokenId}" : 'session';

        return "settings-password-confirmed:user:{$user?->id}:{$tokenKey}";
    }
}
