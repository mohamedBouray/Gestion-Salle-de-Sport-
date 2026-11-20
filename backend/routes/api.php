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

use App\Http\Controllers\Api\Admin\ReservationController as AdminReservationController;
use App\Http\Controllers\Api\Members\ReservationController as MemberReservationController;

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

        // Reservation 
        Route::get('/admin/reservations',[AdminReservationController::class, 'index']);
        Route::get('/admin/reservations/{reservation}',[AdminReservationController::class, 'show']);
        Route::get('/admin/course-sessions/{session}/reservations',[AdminReservationController::class, 'bySession']);
        Route::post('/admin/course-sessions/{session}/reservations',[AdminReservationController::class, 'store'] )->middleware('throttle:20,1');



        // ==========================================
        // ADMIN - GESTION DES PRESENCES
        // MEMBERS + COACHES
        // ==========================================

        Route::get('/admin/attendance/summary',[\App\Http\Controllers\Api\Admin\AttendanceController::class, 'summary']);
        Route::get('/admin/attendance/members', [\App\Http\Controllers\Api\Admin\AttendanceController::class, 'members']);
        Route::get('/admin/attendance/coaches',[\App\Http\Controllers\Api\Admin\AttendanceController::class, 'coaches']);
        Route::post('/admin/attendance/members/check-in', [\App\Http\Controllers\Api\Admin\AttendanceController::class, 'memberCheckIn'])->middleware('throttle:30,1');
        Route::post('/admin/attendance/coaches/check-in', [\App\Http\Controllers\Api\Admin\AttendanceController::class, 'coachCheckIn'])->middleware('throttle:30,1');
        Route::patch('/admin/attendance/members/{attendance}/check-out', [\App\Http\Controllers\Api\Admin\AttendanceController::class, 'memberCheckOut'])->middleware('throttle:30,1');
        Route::patch('/admin/attendance/coaches/{attendance}/check-out',[\App\Http\Controllers\Api\Admin\AttendanceController::class, 'coachCheckOut'])->middleware('throttle:30,1');
        Route::post('/admin/attendance/coaches/absences',[\App\Http\Controllers\Api\Admin\AttendanceController::class, 'coachAbsence']) ->middleware('throttle:30,1');

        
        // landing Page parametrages
        Route::get('/admin/site-settings', [SiteSettingController::class, 'index']);
        Route::put('/admin/site-settings', [SiteSettingController::class, 'update']);
        Route::post('/admin/site-settings/image', [SiteSettingController::class, 'uploadImage'])->middleware('throttle:10,1');

        Route::get('/admin/course-proposals', [\App\Http\Controllers\Api\Admin\CourseProposalReviewController::class, 'index']);
        Route::post('/admin/course-proposals/{proposal}/approve', [\App\Http\Controllers\Api\Admin\CourseProposalReviewController::class, 'approve'])->middleware('throttle:20,1');
        Route::post('/admin/course-proposals/{proposal}/reject', [\App\Http\Controllers\Api\Admin\CourseProposalReviewController::class, 'reject'])->middleware('throttle:20,1');
        

    });



    Route::middleware('role:coach')->group(function () {

        // ==========================================
        // COACH - MES COURS
        // ==========================================

        Route::get('/coach/workspace/courses',
            [\App\Http\Controllers\Api\Coach\CoachCoursePlanningController::class, 'courses']);


        // ==========================================
        // COACH - MON PLANNING
        // ==========================================

        Route::get('/coach/workspace/sessions',
            [\App\Http\Controllers\Api\Coach\CoachCoursePlanningController::class, 'sessions']);


        // ==========================================
        // COACH - MES DISPONIBILITES
        // ==========================================

        Route::get('/coach/workspace/availabilities',
            [\App\Http\Controllers\Api\Coach\CoachCoursePlanningController::class, 'availabilities']);


            Route::get('/coach/course-proposals', [\App\Http\Controllers\Api\Coach\CourseProposalController::class, 'index']);
            Route::post('/coach/course-proposals', [\App\Http\Controllers\Api\Coach\CourseProposalController::class, 'store'])->middleware('throttle:10,1');
            Route::put('/coach/workspace/availabilities', [\App\Http\Controllers\Api\Coach\AvailabilityManagementController::class, 'update'])->middleware('throttle:15,1');



            Route::get(
                '/coach/members',
                [\App\Http\Controllers\Api\Coach\CoachMemberController::class, 'index']
            );

            Route::get(
                '/coach/members/{member}',
                [\App\Http\Controllers\Api\Coach\CoachMemberController::class, 'show']
            );


        // ==========================================
        // COACH - PRESENCES DES SEANCES
        // ==========================================

        Route::get(
            '/coach/attendance/sessions/{session}/participants',
            [
                \App\Http\Controllers\Api\Coach\CoachAttendanceController::class,
                'participants'
            ]
        );

        Route::patch(
            '/coach/attendance/sessions/{session}/enrollments/{enrollment}',
            [
                \App\Http\Controllers\Api\Coach\CoachAttendanceController::class,
                'mark'
            ]
        )->middleware('throttle:30,1');



    });

    Route::middleware('role:member')->group(function () {
        // RESERVATIONS 
        Route::get('/member/reservations',[MemberReservationController::class, 'index'] );
        Route::get('/member/course-sessions',[MemberReservationController::class, 'sessions']);
        Route::post('/member/course-sessions/{session}/reservations',[MemberReservationController::class, 'store'])->middleware('throttle:20,1');
        Route::delete('/member/reservations/{reservation}',[MemberReservationController::class, 'destroy'] )->middleware('throttle:20,1');
    });
});
