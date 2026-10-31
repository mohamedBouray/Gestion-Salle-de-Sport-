<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Models\User;
use App\Http\Controllers\Auth\ProfileController;


Route::get('/setup-status', function () {
    $hasUsers = User::withTrashed()->exists();

    return response()->json([
        'is_setup' => $hasUsers,
    ]);
})->middleware('throttle:30,1');


// Public routes
Route::post('/register', [
    AuthController::class,
    'register'
])->middleware('throttle:5,1');

Route::post('/login', [
    AuthController::class,
    'login'
])->middleware('throttle:5,1');

Route::post('/forgot-password', [
    PasswordResetController::class,
    'forgotPassword'
])->middleware('throttle:5,1');

Route::post('/reset-password', [
    PasswordResetController::class,
    'resetPassword'
])->middleware('throttle:5,1');

Route::middleware([
    'auth:sanctum',
    'active'
])->group(function () {

    // Authenticated user
    Route::get('/me', [
        AuthController::class,
        'me'
    ]);

    Route::post('/logout', [
        AuthController::class,
        'logout'
    ]);
    // UPDATE PROFILE
Route::put('/profile', [
    ProfileController::class,
    'updateProfile'
]);

// CHANGE PASSWORD
Route::put('/change-password', [
    ProfileController::class,
    'changePassword'
])->middleware('throttle:5,1');

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', function () {
            return response()->json([
                'message' => 'Welcome Admin'
            ]);
        });
    });

    // Coach only
    Route::middleware('role:coach')->group(function () {
        Route::get('/coach/dashboard', function () {
            return response()->json([
                'message' => 'Welcome Coach'
            ]);
        });
    });

    // Member only
    Route::middleware('role:member')->group(function () {
        Route::get('/member/dashboard', function () {
            return response()->json([
                'message' => 'Welcome Member'
            ]);
        });
    });
});

