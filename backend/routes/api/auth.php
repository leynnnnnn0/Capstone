<?php

use App\Http\Controllers\Auth\ApiConfirmablePasswordController;
use App\Http\Controllers\Auth\ApiAuthenticatedSessionController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Laravel\Fortify\Http\Controllers\ConfirmedTwoFactorAuthenticationController;
use Laravel\Fortify\Http\Controllers\NewPasswordController;
use Laravel\Fortify\Http\Controllers\PasswordController;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController;
use Laravel\Fortify\Http\Controllers\ProfileInformationController;
use Laravel\Fortify\Http\Controllers\RecoveryCodeController;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController;
use Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController;
use Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController;

Route::post('/login', [ApiAuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:login')
    ->name('login.store');

Route::post('/logout', [ApiAuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth:sanctum')
    ->name('logout');

if (Features::enabled(Features::resetPasswords())) {
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('password.email');

    Route::post('/reset-password', [NewPasswordController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('password.update');
}

if (Features::enabled(Features::registration())) {
    Route::post('/register', [RegisteredUserController::class, 'store'])
        ->middleware('throttle:register')
        ->name('register.store');
}

Route::middleware('auth:sanctum')->group(function () {
    if (Features::enabled(Features::updateProfileInformation())) {
        Route::put('/user/profile-information', [ProfileInformationController::class, 'update'])
            ->name('user-profile-information.update');
    }

    if (Features::enabled(Features::updatePasswords())) {
        Route::put('/user/password', [PasswordController::class, 'update'])
            ->name('user-password.update');
    }

    Route::get('/user/confirmed-password-status', [ApiConfirmablePasswordController::class, 'status'])
        ->name('password.confirmation');

    Route::post('/user/confirm-password', [ApiConfirmablePasswordController::class, 'store'])
        ->name('password.confirm.store');

    if (Features::enabled(Features::twoFactorAuthentication())) {
        Route::post('/user/two-factor-authentication', [TwoFactorAuthenticationController::class, 'store'])
            ->name('two-factor.enable');

        Route::post('/user/confirmed-two-factor-authentication', [ConfirmedTwoFactorAuthenticationController::class, 'store'])
            ->name('two-factor.confirm');

        Route::delete('/user/two-factor-authentication', [TwoFactorAuthenticationController::class, 'destroy'])
            ->name('two-factor.disable');

        Route::get('/user/two-factor-qr-code', [TwoFactorQrCodeController::class, 'show'])
            ->name('two-factor.qr-code');

        Route::get('/user/two-factor-secret-key', [TwoFactorSecretKeyController::class, 'show'])
            ->name('two-factor.secret-key');

        Route::get('/user/two-factor-recovery-codes', [RecoveryCodeController::class, 'index'])
            ->name('two-factor.recovery-codes');

        Route::post('/user/two-factor-recovery-codes', [RecoveryCodeController::class, 'store'])
            ->name('two-factor.regenerate-recovery-codes');
    }
});

if (Features::enabled(Features::twoFactorAuthentication())) {
    Route::post('/two-factor-challenge', [ApiAuthenticatedSessionController::class, 'twoFactorChallenge'])
        ->middleware('throttle:two-factor')
        ->name('two-factor.login.store');
}
