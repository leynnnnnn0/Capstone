<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ApiConfirmablePasswordController extends Controller
{
    public function status(): JsonResponse
    {
        return response()->json(['confirmed' => true]);
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

        return response()->json([
            'status' => true,
            'message' => 'Password confirmed.',
        ]);
    }
}
