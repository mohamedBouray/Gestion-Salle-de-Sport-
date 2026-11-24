<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    public function boot(): void
    {
        VerifyEmail::createUrlUsing(function (User $user) {
            return rtrim((string) config('app.url'), '/') . URL::temporarySignedRoute(
                'verification.verify', now()->addMinutes(60),
                ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())],
                absolute: false,
            );
        });

        ResetPassword::createUrlUsing(function (User $user, string $token) {
            $frontend = rtrim((string) config('gym.frontend_url'), '/');

            if (!$frontend || !filter_var($frontend, FILTER_VALIDATE_URL)) {
                throw new \RuntimeException('Frontend URL is not configured correctly.');
            }

            return $frontend . '/reset-password/' . rawurlencode($token)
                . '?email=' . rawurlencode($user->email);
        });
    }
}
