<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\PasswordConfirmationStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ApiConfirmablePasswordController extends Controller
{
    public function __construct(private readonly PasswordConfirmationStore $passwordConfirmationStore)
    {
    }

    public function status(Request $request): JsonResponse
    {
        return response()->json([
            'confirmed' => $this->passwordConfirmationStore->confirmed($request),
            'expires_in_minutes' => $this->passwordConfirmationStore->expiresInMinutes(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (! Hash::check($request->string('password')->toString(), $request->user()->password)) {
            throw ValidationException::withMessages([
                'password' => ['The provided password is incorrect.'],
            ]);
        }

        $this->passwordConfirmationStore->confirm($request);

        return response()->json([
            'status' => true,
            'message' => 'Password confirmed.',
        ]);
    }
}
