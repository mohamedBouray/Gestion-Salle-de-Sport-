<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    // UPDATE NAME AND PHONE
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:160',
            'phone' => 'nullable|string|max:32',
        ]);

        $user = $request->user();

        $user->name = $validated['name'];
        $user->phone = $validated['phone'] ?? null;

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'status' => $user->status,
                'email_verified_at' => $user->email_verified_at,
            ],
        ]);
    }

    // CHANGE PASSWORD
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => [
                'required',
                'current_password:web',
            ],
            'password' => [
                'required',
                'confirmed',
                'different:current_password',
                Password::min(8)
                    ->mixedCase()
                    ->numbers(),
            ],
        ]);

        $user = $request->user();

        $user->password = Hash::make(
            $validated['password']
        );

        $user->save();

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }
}
