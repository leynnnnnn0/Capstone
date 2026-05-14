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
        RateLimiter::for('customer-otp-request', function (Request $request) {
            return [
                Limit::perMinute(5)
                    ->by($request->ip())
                    ->response(fn() => response()->json([
                        'message' => 'Too many code requests. Please try again later.',
                    ], 429)),
                Limit::perMinutes(10, 5)
                    ->by(strtolower((string) $request->input('contact')))
                    ->response(fn() => response()->json([
                        'message' => 'Too many code requests for this contact. Please try again later.',
                    ], 429)),
            ];
        });

        RateLimiter::for('customer-otp-verify', function (Request $request) {
            return [
                Limit::perMinute(10)
                    ->by($request->ip())
                    ->response(fn() => response()->json([
                        'message' => 'Too many verification attempts. Please try again later.',
                    ], 429)),
                Limit::perMinutes(10, 10)
                    ->by(strtolower((string) $request->input('contact')))
                    ->response(fn() => response()->json([
                        'message' => 'Too many verification attempts for this contact. Please request a new code.',
                    ], 429)),
            ];
        });

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
