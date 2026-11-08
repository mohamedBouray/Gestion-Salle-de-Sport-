<?php

namespace App\Services;

use App\Models\AccountInvitation;
use App\Models\User;
use App\Notifications\GymAccountInvitation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AccountInvitationService
{

    public function send(User $user, User $admin): bool {
        if (!in_array($user->role, [User::MEMBER, User::COACH], true)
            || $user->status !== 'pending') {
            throw ValidationException::withMessages([
                'invitation' => ["Seul un compte en attente peut recevoir une invitation."],
            ]);
        }

        $rawToken = Str::random(64);
        $hours = max(1, (int) config('gym.invitation_hours', 48));

        DB::transaction(function () use ($user, $admin, $rawToken, $hours) {
            // Serialize resend requests for the same account.
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();

            AccountInvitation::where('user_id', $user->id)
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            AccountInvitation::create([
                'user_id' => $user->id,
                'invited_by_user_id' => $admin->id,
                'role' => $user->role,
                'token_hash' => hash('sha256', $rawToken),
                'expires_at' => now()->addHours($hours),
            ]);
        });

        $frontend = rtrim((string) config('gym.frontend_url'), '/');
        $url = $frontend.'/activate-account?'.http_build_query([
            'token' => $rawToken,
            'email' => $user->email,
        ]);

        try {
            $user->notify(new GymAccountInvitation($url, $user->role, $hours));
            return true;
        } catch (Throwable $exception) {
            report($exception);
            return false;
        }
    }
}
