<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Actions\Fortify\UpdateUserPassword;
use App\Actions\Fortify\UpdateUserProfileInformation;
use App\Http\Responses\Fortify\ApiFailedPasswordConfirmationResponse;
use App\Http\Responses\Fortify\ApiFortifySuccessResponse;
use App\Http\Responses\RegisterResponse;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Contracts\FailedPasswordConfirmationResponse;
use Laravel\Fortify\Contracts\PasswordConfirmedResponse;
use Laravel\Fortify\Contracts\PasswordUpdateResponse;
use Laravel\Fortify\Contracts\ProfileInformationUpdatedResponse;
use Laravel\Fortify\Contracts\RecoveryCodesGeneratedResponse;
use Laravel\Fortify\Contracts\TwoFactorConfirmedResponse;
use Laravel\Fortify\Contracts\TwoFactorDisabledResponse;
use Laravel\Fortify\Contracts\TwoFactorEnabledResponse;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Fortify::ignoreRoutes();

        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::updateUserProfileInformationUsing(UpdateUserProfileInformation::class);
        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::redirectUserForTwoFactorAuthenticationUsing(RedirectIfTwoFactorAuthenticatable::class);

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->input('challenge_id') ?: $request->ip());
        });

        $this->app->singleton(RegisterResponseContract::class, RegisterResponse::class);
        $this->app->singleton(ProfileInformationUpdatedResponse::class, ApiFortifySuccessResponse::class);
        $this->app->singleton(PasswordUpdateResponse::class, ApiFortifySuccessResponse::class);
        $this->app->singleton(PasswordConfirmedResponse::class, ApiFortifySuccessResponse::class);
        $this->app->singleton(FailedPasswordConfirmationResponse::class, ApiFailedPasswordConfirmationResponse::class);
        $this->app->singleton(TwoFactorEnabledResponse::class, ApiFortifySuccessResponse::class);
        $this->app->singleton(TwoFactorConfirmedResponse::class, ApiFortifySuccessResponse::class);
        $this->app->singleton(TwoFactorDisabledResponse::class, ApiFortifySuccessResponse::class);
        $this->app->singleton(RecoveryCodesGeneratedResponse::class, ApiFortifySuccessResponse::class);
    }
}
