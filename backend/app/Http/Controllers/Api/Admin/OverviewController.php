<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Models\MemberSubscription;
use App\Models\Payment;
use App\Models\PersonalTrainingRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class OverviewController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'stats' => [
                'members' => User::where('role', 'member')->where('status', 'active')->count(),
                'coaches' => User::where('role', 'coach')->where('status', 'active')->count(),
                'courses' => Course::where('status', 'active')->count(),
                'pending_courses' => Course::where('status', 'pending')->count(),
                'upcoming_sessions' => CourseSession::where('status', 'scheduled')->where('start_at', '>=', now())->count(),
                'reservations' => CourseEnrollment::whereIn('status', ['pending','confirmed','attended'])->count(),
                'active_memberships' => MemberSubscription::where('status', 'active')
                    ->whereDate('starts_at', '<=', today())->whereDate('ends_at', '>=', today())->count(),
                'paid_revenue' => Payment::where('status', 'paid')->sum('amount'),
                'new_messages' => ContactMessage::where('status', 'new')->count(),
                'pending_requests' => PersonalTrainingRequest::where('status', 'pending')->count(),
            ],
            'upcoming' => CourseSession::query()->with(['course:id,name','coach:id,name'])
                ->where('status', 'scheduled')->where('start_at', '>=', now())
                ->orderBy('start_at')->limit(6)->get(),
        ]);
    }
}
