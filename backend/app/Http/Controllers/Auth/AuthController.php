<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

class AuthController extends Controller
{
    
    
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:160',
            'email' => 'required|email|max:190|unique:users,email',
            'phone' => 'nullable|string|max:32',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->mixedCase()->numbers(),
            ],
        ]);

        // Prevent simultaneous first-admin registrations
        $lock = DB::selectOne(
            'SELECT GET_LOCK(?, 10) AS acquired',
            ['gym_first_admin_registration']
        );

        if ((int) ($lock->acquired ?? 0) !== 1) {
            throw new ServiceUnavailableHttpException(
                5,
                'Registration is temporarily busy.'
            );
        }

        try {
            $user = DB::transaction(function () use ($validated) {

                $isFirstUser = !User::withTrashed()->exists();
                
                if (
                    $isFirstUser &&
                    !config('auth.allow_initial_admin_registration', false)
                ) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'registration' => [
                            'Initial administrator setup is disabled.'
                        ],
                    ]);
                }
                
                $user = new User();

                $user->name = $validated['name'];
                $user->email = $validated['email'];
                $user->phone = $validated['phone'] ?? null;
                $user->password = Hash::make(
                    $validated['password']
                );

                $user->role = $isFirstUser
                    ? 'admin'
                    : 'member';

                $user->status = 'active';

                $user->save();

                return $user;
            });

        } finally {
            DB::select(
                'SELECT RELEASE_LOCK(?)',
                ['gym_first_admin_registration']
            );
        }

        Auth::guard('web')->login($user);

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Registration successful',
            'user' => $this->userData($user),
        ], 201);
    }



    // LOGIN
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'remember' => 'sometimes|boolean',
        ]);

        $user = User::where(
            'email',
            $validated['email']
        )->first();

        if (!$user || !Hash::check(
            $validated['password'],
            $user->password
        )) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is not active.',
            ], 403);
        }

        Auth::guard('web')->login(
            $user,
            $request->boolean('remember')
        );

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login successful',
            'user' => $this->userData($user),
        ]);
    }

    // AUTHENTICATED USER
    public function me(Request $request)
    {
        $user = $request->user();

        if ($user->status !== 'active') {
            Auth::guard('web')->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'message' => 'Account inactive',
            ], 403);
        }

        return response()->json([
            'user' => $this->userData($user),
        ]);
    }

    // LOGOUT
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout successful',
        ]);
    }

    private function userData(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'status' => $user->status,
            'email_verified_at' => $user->email_verified_at,
        ];
    }
}
