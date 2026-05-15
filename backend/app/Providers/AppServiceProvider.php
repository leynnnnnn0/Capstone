<?php

namespace App\Providers;

use App\Http\Responses\LoginResponse;
use App\Events\AppointmentBooked;
use App\Events\AppointmentCancelled;
use App\Events\AppointmentConfirmed;
use App\Events\AppointmentRescheduled;
use App\Events\AppointmentStatusChanged;
use App\Events\AppointmentUpdated;
use App\Events\QuotationChanged;
use App\Events\QuotationSigned;
use App\Events\QuotationSignatureInvalidated;
use App\Events\WorkJobChanged;
use App\Listeners\DispatchRealtimeNotification;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use App\Http\Responses\LogoutResponse;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Laravel\Fortify\Fortify;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LoginResponseContract::class, LoginResponse::class);
        $this->app->singleton(LogoutResponseContract::class, LogoutResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        foreach ([
            AppointmentBooked::class,
            AppointmentCancelled::class,
            AppointmentConfirmed::class,
            AppointmentRescheduled::class,
            AppointmentStatusChanged::class,
            AppointmentUpdated::class,
            QuotationChanged::class,
            QuotationSigned::class,
            QuotationSignatureInvalidated::class,
            WorkJobChanged::class,
        ] as $event) {
            Event::listen($event, DispatchRealtimeNotification::class);
        }

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        if (env('APP_ENV') === 'production') {
            URL::forceScheme('https');
        }

        Fortify::resetPasswordView(function ($request) {
            return redirect(
                env('FRONTEND_URL') . '/reset-password?token=' . $request->token . '&email=' . urlencode($request->email)
            );
        });
    }
}
