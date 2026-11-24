<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->isActive()) {
            return response()->json([
                'message' => 'Votre compte a été désactivé.',
                'code' => 'ACCOUNT_INACTIVE',
            ], 403);
        }

        if ($user->isMember() && !$user->hasVerifiedEmail() && !$request->is('api/logout')) {
            return response()->json([
                'message' => 'Vérifiez votre adresse e-mail avant de vous connecter.',
                'code' => 'EMAIL_UNVERIFIED',
            ], 403);
        }

        return $next($request);
    }
}
