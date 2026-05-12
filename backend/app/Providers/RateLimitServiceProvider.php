<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimitServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->configureAuthLimiters();
        $this->configureFormLimiters();

    }

    private function configureAuthLimiters(): void
    {
        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(fn() => response()->json([
                    'message' => 'Too many registration attempts. Please try again later.',
                ], 429));
        });

        RateLimiter::for('login', function (Request $request) {
            return [
                Limit::perMinute(5)
                    ->by($request->ip())
                    ->response(fn() => response()->json([
                        'message' => 'Too many login attempts. Please try again in a minute.',
                    ], 429)),
                Limit::perMinute(3)
                    ->by($request->input('email'))
                    ->response(fn() => response()->json([
                        'message' => 'Too many login attempts for this account. Please try again in a minute.',
                    ], 429)),
            ];
        });

        RateLimiter::for('forgot-password', function (Request $request) {
            return Limit::perMinute(3)
                ->by($request->ip())
                ->response(fn() => response()->json([
                    'message' => 'Too many password reset attempts. Please try again later.',
                ], 429));
        });
    }

    private function configureFormLimiters(): void
    {
        
    }
}
