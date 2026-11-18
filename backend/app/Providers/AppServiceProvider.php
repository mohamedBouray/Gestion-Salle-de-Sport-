<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    public function boot(): void
    {
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
