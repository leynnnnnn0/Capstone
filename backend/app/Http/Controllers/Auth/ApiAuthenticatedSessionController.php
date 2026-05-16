<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;
use Laravel\Fortify\Fortify;

class ApiAuthenticatedSessionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => [trans('auth.failed')],
            ]);
        }

        if ($user->hasEnabledTwoFactorAuthentication()) {
            $challengeId = Str::random(64);

            Cache::put($this->challengeCacheKey($challengeId), [
                'user_id' => $user->id,
                'remember' => $request->boolean('remember'),
            ], now()->addMinutes(5));

            return response()->json([
                'two_factor' => true,
                'challenge_id' => $challengeId,
            ]);
        }

        return $this->authenticatedResponse($user, $request->boolean('remember'));
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()
            ->json(['status' => true, 'message' => 'Logged out.'])
            ->withoutCookie('auth_token', '/', env('SESSION_DOMAIN', ''))
            ->withoutCookie('user_role', '/', env('SESSION_DOMAIN', ''));
    }

    public function twoFactorChallenge(Request $request, TwoFactorAuthenticationProvider $provider): JsonResponse
    {
        $validated = $request->validate([
            'challenge_id' => ['required', 'string'],
            'code' => ['nullable', 'string'],
            'recovery_code' => ['nullable', 'string'],
        ]);

        if (blank($validated['code'] ?? null) && blank($validated['recovery_code'] ?? null)) {
            throw ValidationException::withMessages([
                'code' => ['The authentication code or recovery code is required.'],
            ]);
        }

        $cacheKey = $this->challengeCacheKey($validated['challenge_id']);
        $challenge = Cache::get($cacheKey);

        if (! $challenge) {
            throw ValidationException::withMessages([
                'challenge_id' => ['The two-factor challenge has expired. Please sign in again.'],
            ]);
        }

        $user = User::find($challenge['user_id']);

        if (! $user || ! $this->validTwoFactorCode($user, $provider, $validated)) {
            throw ValidationException::withMessages([
                'code' => ['The provided two-factor authentication code was invalid.'],
            ]);
        }

        Cache::forget($cacheKey);

        return $this->authenticatedResponse($user, (bool) $challenge['remember']);
    }

    private function validTwoFactorCode(User $user, TwoFactorAuthenticationProvider $provider, array $input): bool
    {
        if (filled($input['code'] ?? null) && $provider->verify(
            Fortify::currentEncrypter()->decrypt($user->two_factor_secret),
            $input['code']
        )) {
            return true;
        }

        if (filled($input['recovery_code'] ?? null) && in_array($input['recovery_code'], $user->recoveryCodes(), true)) {
            $user->replaceRecoveryCode($input['recovery_code']);

            return true;
        }

        return false;
    }

    private function authenticatedResponse(User $user, bool $remember): JsonResponse
    {
        $minutes = $remember ? 60 * 24 * 14 : 60;
        $expiresAt = $remember ? now()->addDays(14) : now()->addHour();
        $token = $user->createToken('auth-token', ['*'], $expiresAt)->plainTextToken;

        $user->load('roles', 'permissions');
        $role = $user->getRoleNames()->first() ?? $user->role;
        $response = ['user' => UserResource::make($user)];

        if (! app()->environment('production')) {
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
                app()->environment('production'),
                true,
                false,
                'Lax'
            )
            ->cookie(
                'user_role',
                $role,
                $minutes,
                '/',
                env('SESSION_DOMAIN', ''),
                app()->environment('production'),
                false,
                false,
                'Lax'
            );
    }

    private function challengeCacheKey(string $challengeId): string
    {
        return "staff-login-two-factor:{$challengeId}";
    }
}
