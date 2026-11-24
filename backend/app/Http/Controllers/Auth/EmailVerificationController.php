<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;

class EmailVerificationController extends Controller
{
    public function __invoke(string $id, string $hash): RedirectResponse
    {
        DB::transaction(function () use ($id, $hash) {
            $user = User::query()->whereKey($id)->lockForUpdate()->firstOrFail();
            abort_unless($user->isMember() && $user->isActive()
                && hash_equals(sha1($user->getEmailForVerification()), $hash), 403);
            if (!$user->hasVerifiedEmail() && $user->markEmailAsVerified()) {
                event(new Verified($user));
            }
        });
        return redirect()->away(rtrim(config('gym.frontend_url'), '/').'/login?verified=1');
    }
}
