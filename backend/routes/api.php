<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;

// Auth 
use App\Http\Controllers\Auth\AccountActivationController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ProfileController;

// Public 
use App\Http\Controllers\Api\Public\ContactController;
use App\Http\Controllers\Api\Public\SiteController;
use App\Http\Controllers\Api\GlobalSearchController;
use App\Http\Controllers\Api\DashboardController ;

// Admin
use App\Http\Controllers\Api\Admin\MessageController;
use App\Http\Controllers\Api\Admin\CoachController;
use App\Http\Controllers\Api\Admin\MemberController;
use App\Http\Controllers\Api\Admin\ReservationController as AdminReservationController;
use App\Http\Controllers\Api\Admin\SiteSettingController;
use App\Http\Controllers\Api\Admin\CoachesExportController;
use App\Http\Controllers\Api\Admin\MembersExportController;
use App\Http\Controllers\Api\Admin\CoursesExportController;
use App\Http\Controllers\Api\Admin\CourseController;
use App\Http\Controllers\Api\Admin\CourseSessionController;
use App\Http\Controllers\Api\Admin\CoachAvailabilityController;
use App\Http\Controllers\Api\Admin\AttendanceController;
use App\Http\Controllers\Api\Admin\CourseProposalReviewController;
use App\Http\Controllers\Api\Admin\TariffController;
use App\Http\Controllers\Api\Admin\MembershipController;
use App\Http\Controllers\Api\Admin\PaymentController;

// Coach
use App\Http\Controllers\Api\Coach\CoachCoursePlanningController;
use App\Http\Controllers\Api\Coach\CourseProposalController;
use App\Http\Controllers\Api\Coach\AvailabilityManagementController;
use App\Http\Controllers\Api\Coach\CoachMemberController;
use App\Http\Controllers\Api\Coach\CoachAttendanceController;

// Members
use App\Http\Controllers\Api\Members\ReservationController as MemberReservationController;
use App\Http\Controllers\Api\Members\CourseController as MemberCourseController;
use App\Http\Controllers\Api\Members\MemberAccountController;
use App\Http\Controllers\Api\Members\MemberPaymentController;


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
    Route::get('/search', [GlobalSearchController::class, 'index'])->middleware('throttle:30,1');
    
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard',[DashboardController::class, 'admin']);
        // Messages 
        Route::get('/admin/messages', [MessageController::class, 'index']);
        Route::patch('/admin/messages/{message}', [MessageController::class, 'update']);
        Route::post('/admin/messages/{message}/reply',[MessageController::class, 'reply'])->middleware('throttle:10,1');
        // Coaches 
        Route::get('/admin/coaches/export',CoachesExportController::class)->name('admin.coaches.export');
        Route::post('/admin/coaches/{coach}/resend-invitation', [CoachController::class, 'resendInvitation'])->middleware('throttle:5,1');
        Route::apiResource('admin/coaches', CoachController::class);
        // gestion members 
        Route::get('/admin/members/export',MembersExportController::class)->name('admin.members.export');
        Route::apiResource('admin/members', MemberController::class);
        Route::post('/admin/members/{member}/resend-invitation', [MemberController::class, 'resendInvitation'])->middleware('throttle:5,1');
        // GESTION DES COURS SPORTIFS
        Route::get('/admin/courses/export',CoursesExportController::class)->name('admin.courses.export');
        Route::apiResource('admin/courses', CourseController::class);
        //  GESTION DU PLANNING
        Route::get('/admin/course-sessions', [CourseSessionController::class,'index'] )->name('admin.course-sessions.index');
        Route::post('/admin/course-sessions',[CourseSessionController::class,'store'])->name('admin.course-sessions.store');
        Route::put('/admin/course-sessions/{session}',[CourseSessionController::class,'update'])->name('admin.course-sessions.update');
        //  DISPONIBILITES DES COACHS
        Route::get('/admin/coaches/{coach}/availabilities',[CoachAvailabilityController::class,'index'] )->name('admin.coaches.availabilities.index');
        // Reservation 
        Route::get('/admin/reservations',[AdminReservationController::class, 'index']);
        Route::get('/admin/reservations/{reservation}',[AdminReservationController::class, 'show']);
        Route::get('/admin/course-sessions/{session}/reservations',[AdminReservationController::class, 'bySession']);
        Route::post('/admin/course-sessions/{session}/reservations',[AdminReservationController::class, 'store'] )->middleware('throttle:20,1');
        //  GESTION DES PRESENCES
        Route::get('/admin/attendance/summary',[AttendanceController::class, 'summary']);
        Route::get('/admin/attendance/members', [AttendanceController::class, 'members']);
        Route::get('/admin/attendance/coaches',[AttendanceController::class, 'coaches']);
        Route::post('/admin/attendance/members/check-in', [AttendanceController::class, 'memberCheckIn'])->middleware('throttle:30,1');
        Route::post('/admin/attendance/coaches/check-in', [AttendanceController::class, 'coachCheckIn'])->middleware('throttle:30,1');
        Route::patch('/admin/attendance/members/{attendance}/check-out', [AttendanceController::class, 'memberCheckOut'])->middleware('throttle:30,1');
        Route::patch('/admin/attendance/coaches/{attendance}/check-out',[AttendanceController::class, 'coachCheckOut'])->middleware('throttle:30,1');
        Route::post('/admin/attendance/coaches/absences',[AttendanceController::class, 'coachAbsence']) ->middleware('throttle:30,1');
        // landing Page parametrages
        Route::get('/admin/site-settings', [SiteSettingController::class, 'index']);
        Route::put('/admin/site-settings', [SiteSettingController::class, 'update']);
        Route::post('/admin/site-settings/image', [SiteSettingController::class, 'uploadImage'])->middleware('throttle:10,1');
        // course-proposals
        Route::get('/admin/course-proposals', [CourseProposalReviewController::class, 'index']);
        Route::post('/admin/course-proposals/{proposal}/approve', [CourseProposalReviewController::class, 'approve'])->middleware('throttle:20,1');
        Route::post('/admin/course-proposals/{proposal}/reject', [CourseProposalReviewController::class, 'reject'])->middleware('throttle:20,1');
        //  TARIFS DE LA SALLE
        Route::get('/admin/tariffs',[TariffController::class, 'index']);
        Route::post('/admin/tariffs',[TariffController::class, 'store'])->middleware('throttle:20,1');
        Route::put('/admin/tariffs/{tariff}',[TariffController::class, 'update'] )->middleware('throttle:20,1');
        Route::patch('/admin/tariffs/{tariff}/status', [TariffController::class, 'changeStatus'])->middleware('throttle:20,1');
        //GESTION DES ABONNEMENTS
        Route::get('/admin/memberships/options',[MembershipController::class,'options']);
        Route::get('/admin/memberships',[MembershipController::class,'index']);
        Route::post('/admin/memberships',[MembershipController::class,'store'])->middleware('throttle:20,1');
        Route::patch('/admin/memberships/{membership}/activate',[MembershipController::class,'activate'])->middleware('throttle:20,1');
        Route::post('/admin/memberships/{membership}/renew',[MembershipController::class,'renew'])->middleware('throttle:20,1');
        Route::patch('/admin/memberships/{membership}/cancel',[MembershipController::class,'cancel'])->middleware('throttle:20,1');
        // ADMIN - GESTION DES PAIEMENTS
        Route::get('/admin/payments/options',[PaymentController::class,'options']);
        Route::get('/admin/payments',[PaymentController::class,'index']);
        Route::post('/admin/payments',[PaymentController::class,'store'])->middleware('throttle:20,1');
        Route::patch('/admin/payments/{payment}/refund',[PaymentController::class,'refund'])->middleware('throttle:20,1');
    });

    Route::middleware('role:coach')->group(function () {
        Route::get('/coach/dashboard',[DashboardController::class, 'coach']);
        //MES COURS
        Route::get('/coach/workspace/courses',[CoachCoursePlanningController::class, 'courses']);
        // MON PLANNING
        Route::get('/coach/workspace/sessions', [CoachCoursePlanningController::class, 'sessions']);
        // MES DISPONIBILITES
        Route::get('/coach/workspace/availabilities', [CoachCoursePlanningController::class, 'availabilities']);
        Route::get('/coach/course-proposals', [CourseProposalController::class, 'index']);
        Route::post('/coach/course-proposals', [CourseProposalController::class, 'store'])->middleware('throttle:10,1');
        Route::put('/coach/workspace/availabilities', [AvailabilityManagementController::class, 'update'])->middleware('throttle:15,1');
        Route::get('/coach/members',[CoachMemberController::class, 'index']);
        Route::get('/coach/members/{member}',[CoachMemberController::class, 'show']);
        // PRESENCES DES SEANCES
        Route::get('/coach/attendance/sessions/{session}/participants',[CoachAttendanceController::class, 'participants' ]);
        Route::patch('/coach/attendance/sessions/{session}/enrollments/{enrollment}',[CoachAttendanceController::class,'mark'])->middleware('throttle:30,1');
    });

    Route::middleware('role:member')->group(function () {
        Route::get('/member/dashboard',[DashboardController::class, 'member']);
        // RESERVATIONS 
        Route::get('/member/reservations',[MemberReservationController::class, 'index'] );
        Route::get('/member/course-sessions',[MemberReservationController::class, 'sessions']);
        Route::post('/member/course-sessions/{session}/reservations',[MemberReservationController::class, 'store'])->middleware('throttle:20,1');
        Route::delete('/member/reservations/{reservation}',[MemberReservationController::class, 'destroy'] )->middleware('throttle:20,1');
        // - EXPLORER LES COURS
        Route::get('/member/courses',[MemberCourseController::class,'index']);
        //  MON ABONNEMENT
        Route::get('/member/membership',[MemberAccountController::class,'memberships']);
        //  MES PRESENCES
        Route::get('/member/attendance',[MemberAccountController::class,'attendance']);
        //  MES PAIEMENTS
        Route::get('/member/payments',[MemberPaymentController::class,'index']);
    });
});
