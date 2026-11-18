<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\AccountActivationController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ProfileController;

use App\Http\Controllers\Api\Public\ContactController;
use App\Http\Controllers\Api\Public\SiteController;

use App\Http\Controllers\Api\Admin\MessageController;
use App\Http\Controllers\Api\Admin\CoachController;
use App\Http\Controllers\Api\Admin\MemberController;
use App\Http\Controllers\Api\Admin\SiteSettingController;



Route::get('/setup-status', function () {return response()->json(['is_setup' => User::withTrashed()->exists()]);})->middleware('throttle:30,1');
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:5,1');


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

        // Messages 
        Route::get('/admin/messages', [MessageController::class, 'index']);
        Route::patch('/admin/messages/{message}', [MessageController::class, 'update']);
        Route::post('/admin/messages/{message}/reply',[MessageController::class, 'reply'])->middleware('throttle:10,1');

        // Coaches 
        Route::get('/admin/coaches/export',\App\Http\Controllers\Api\Admin\CoachesExportController::class)->name('admin.coaches.export');
        Route::post('/admin/coaches/{coach}/resend-invitation', [CoachController::class, 'resendInvitation'])->middleware('throttle:5,1');
        Route::apiResource('admin/coaches', CoachController::class);

        // gestion members 
        Route::get('/admin/members/export', \App\Http\Controllers\Api\Admin\MembersExportController::class)->name('admin.members.export');
        Route::apiResource('admin/members', MemberController::class);
        Route::post('/admin/members/{member}/resend-invitation', [MemberController::class, 'resendInvitation'])->middleware('throttle:5,1');

        // GESTION DES COURS SPORTIFS
        Route::get('/admin/courses/export',\App\Http\Controllers\Api\Admin\CoursesExportController::class)->name('admin.courses.export');
        Route::apiResource('admin/courses', \App\Http\Controllers\Api\Admin\CourseController::class);
        // ==========================================
        // ADMIN - GESTION DU PLANNING
        // ==========================================
        Route::get('/admin/course-sessions', [\App\Http\Controllers\Api\Admin\CourseSessionController::class,'index'] )->name('admin.course-sessions.index');
        Route::post('/admin/course-sessions',[App\Http\Controllers\Api\Admin\CourseSessionController::class,'store'])->name('admin.course-sessions.store');
        Route::put('/admin/course-sessions/{session}',[\App\Http\Controllers\Api\Admin\CourseSessionController::class,'update'])->name('admin.course-sessions.update');
        // ==========================================
        // ADMIN - DISPONIBILITES DES COACHS
        // ==========================================
        Route::get('/admin/coaches/{coach}/availabilities',[\App\Http\Controllers\Api\Admin\CoachAvailabilityController::class,'index'] )->name('admin.coaches.availabilities.index');

        // landing Page parametrages
        Route::get('/admin/site-settings', [SiteSettingController::class, 'index']);
        Route::put('/admin/site-settings', [SiteSettingController::class, 'update']);
        Route::post('/admin/site-settings/image', [SiteSettingController::class, 'uploadImage'])->middleware('throttle:10,1');


        

    });



    Route::middleware('role:coach')->group(function () {
    });

    Route::middleware('role:member')->group(function () {
    });
});
