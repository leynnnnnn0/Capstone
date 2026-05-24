<?php

namespace App\Http\Middleware;

use App\Services\Auth\PasswordConfirmationStore;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRecentPasswordConfirmed
{
    public function __construct(private readonly PasswordConfirmationStore $passwordConfirmationStore)
    {
    }

    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        if ($this->passwordConfirmationStore->confirmed($request)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Please confirm your password before continuing.',
            'errors' => [
                'password' => ['Please confirm your password before continuing.'],
            ],
        ], 423);
    }
}
