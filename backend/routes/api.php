<?php

use App\Http\Controllers\Auth\AccountActivationController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Api\Admin\CoachController;
use App\Http\Controllers\Api\Admin\MemberController;
use App\Models\User;
use Illuminate\Support\Facades\Route;


use App\Http\Controllers\Api\Admin\SiteSettingController;
use App\Http\Controllers\Api\Public\SiteController;


Route::get('/setup-status', function () {
    return response()->json(['is_setup' => User::withTrashed()->exists()]);
})->middleware('throttle:30,1');

Route::get('/site-settings', [SiteController::class, 'index'])->middleware('throttle:60,1');

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])->middleware('throttle:5,1');
Route::post('/accept-invitation', [AccountActivationController::class, 'accept'])->middleware('throttle:10,1');

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [ProfileController::class, 'updateProfile']);
    Route::put('/change-password', [ProfileController::class, 'changePassword'])->middleware('throttle:5,1');
    




    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', fn () => response()->json(['message' => 'Welcome Admin']));
        Route::post('/admin/members/{member}/resend-invitation', [MemberController::class, 'resendInvitation'])
            ->middleware('throttle:5,1');
    
        Route::post('/admin/coaches/{coach}/resend-invitation', [CoachController::class, 'resendInvitation'])
            ->middleware('throttle:5,1');

        Route::apiResource('admin/coaches', CoachController::class);
        Route::apiResource('admin/members', MemberController::class);
        Route::get('/admin/site-settings', [SiteSettingController::class, 'index']);
        Route::put('/admin/site-settings', [SiteSettingController::class, 'update']);
        Route::post('/admin/site-settings/image', [SiteSettingController::class, 'uploadImage'])->middleware('throttle:10,1');
    });







    Route::middleware('role:coach')->group(function () {
        Route::get('/coach/dashboard', fn () => response()->json(['message' => 'Welcome Coach']));
    });

    Route::middleware('role:member')->group(function () {
        Route::get('/member/dashboard', fn () => response()->json(['message' => 'Welcome Member']));
    });
});
