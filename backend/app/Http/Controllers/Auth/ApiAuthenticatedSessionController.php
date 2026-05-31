<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Audit\AuthAuditLogger;
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
    public function __construct(
        private readonly AuthAuditLogger $authAuditLogger
    ) {}

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

            $this->authAuditLogger->log(
                request: $request,
                event: 'staff_login_two_factor_challenge',
                auditable: $user,
                actor: $user,
                newValues: [
                    'role' => $this->roleName($user),
                    'remember' => $request->boolean('remember'),
                    'expires_in_minutes' => 5,
                ]
            );

            return response()->json([
                'two_factor' => true,
                'challenge_id' => $challengeId,
            ]);
        }

        return $this->authenticatedResponse($request, $user, $request->boolean('remember'), 'staff_login');
    }

    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user instanceof User) {
            $this->authAuditLogger->log(
                request: $request,
                event: $user->isCustomer() ? 'customer_logout' : 'staff_logout',
                auditable: $user,
                actor: $user,
                newValues: [
                    'role' => $this->roleName($user),
                ]
            );
        }

        $user?->currentAccessToken()?->delete();

        return response()
            ->json(['status' => true, 'message' => 'Logged out.'])
            ->withoutCookie('auth_token', '/', config('session.domain'))
            ->withoutCookie('user_role', '/', config('session.domain'));
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

        return $this->authenticatedResponse($request, $user, (bool) $challenge['remember'], 'staff_login');
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

    private function authenticatedResponse(Request $request, User $user, bool $remember, string $event): JsonResponse
    {
        $minutes = $remember ? 60 * 24 * 14 : 60;
        $expiresAt = $remember ? now()->addDays(14) : now()->addHour();
        $token = $user->createToken('auth-token', ['*'], $expiresAt)->plainTextToken;

        $user->load('roles', 'permissions');
        $role = $this->roleName($user);
        $response = ['user' => UserResource::make($user)];

        if (! app()->environment('production')) {
            $response['token'] = $token;
        }

        $this->authAuditLogger->log(
            request: $request,
            event: $event,
            auditable: $user,
            actor: $user,
            newValues: [
                'role' => $role,
                'remember' => $remember,
                'expires_at' => $expiresAt->toISOString(),
            ]
        );

        return response()
            ->json($response)
            ->cookie(
                'auth_token',
                $token,
                $minutes,
                '/',
                config('session.domain'),
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
                config('session.domain'),
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

    private function roleName(User $user): string
    {
        return $user->relationLoaded('roles')
            ? ($user->getRoleNames()->first() ?? $user->role)
            : ($user->roles()->value('name') ?? $user->role);
    }
}
