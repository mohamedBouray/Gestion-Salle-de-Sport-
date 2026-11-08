<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AccountInvitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AccountActivationController extends Controller
{
    public function accept(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'min:20'],
            'email' => ['required', 'email', 'max:190'],
            'password' => [
                'required', 'confirmed',
                Password::min(8)->mixedCase()->numbers(),
            ],
        ]);

        DB::transaction(function () use ($data) {
            $invitation = AccountInvitation::where(
                'token_hash', hash('sha256', $data['token'])
            )->lockForUpdate()->first();

            $invalid = !$invitation || $invitation->accepted_at !== null || $invitation->revoked_at !== null || $invitation->expires_at->isPast();

            if ($invalid) {
                throw ValidationException::withMessages([
                    'token' => ['Invitation invalide ou expirée. Demandez un nouvel e-mail à votre administrateur.'],
                ]);
            }

            $user = User::whereKey($invitation->user_id)->lockForUpdate()->first();

            if (!$user || mb_strtolower($user->email) !== mb_strtolower($data['email']) || $user->role !== $invitation->role || $user->status !== 'pending') {
                throw ValidationException::withMessages([
                    'token' => ['Cette invitation ne correspond plus à un compte en attente.'],
                ]);
            }
            
            $user->password = $data['password'];
            $user->status = 'active';
            $user->email_verified_at = now();
            $user->save();

            $invitation->accepted_at = now();
            $invitation->save();
        });

        return response()->json([
            'message' => 'Compte activé. Vous pouvez maintenant vous connecter.',
        ]);
    }
}
