<?php

namespace App\Models\Concerns;

use App\Models\AccountInvitation;
use App\Models\CoachAvailability;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Models\MemberSubscription;
use App\Models\Payment;
use App\Models\PersonalTrainingRequest;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Include this trait inside your EXISTING User model.
 * It adds relationships without touching Laravel Sanctum auth, fillable,
 * password hashing, roles, statuses, or your existing User.php.
 */
trait HasGymRelationships
{
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function createdUsers(): HasMany
    {
        return $this->hasMany(User::class, 'created_by_user_id');
    }

    public function accountInvitations(): HasMany
    {
        return $this->hasMany(AccountInvitation::class, 'user_id');
    }

    public function sentInvitations(): HasMany
    {
        return $this->hasMany(AccountInvitation::class, 'invited_by_user_id');
    }

    public function coachedCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'coach_id');
    }

    public function createdCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'created_by_user_id');
    }

    public function coachedSessions(): HasMany
    {
        return $this->hasMany(CourseSession::class, 'coach_id');
    }

    public function courseEnrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class, 'member_id');
    }

    public function bookedCourseSessions(): BelongsToMany
    {
        return $this->belongsToMany(CourseSession::class, 'course_enrollments', 'member_id', 'session_id')
            ->withPivot(['id', 'price_at_booking', 'status', 'enrolled_at', 'cancelled_at'])
            ->withTimestamps();
    }

    public function coachAvailabilities(): HasMany
    {
        return $this->hasMany(CoachAvailability::class, 'coach_id');
    }

    public function personalPlans(): HasMany
    {
        return $this->hasMany(SubscriptionPlan::class, 'coach_id');
    }

    public function memberSubscriptions(): HasMany
    {
        return $this->hasMany(MemberSubscription::class, 'member_id');
    }

    public function personalTrainingRequests(): HasMany
    {
        return $this->hasMany(PersonalTrainingRequest::class, 'member_id');
    }

    public function receivedPersonalTrainingRequests(): HasMany
    {
        return $this->hasMany(PersonalTrainingRequest::class, 'coach_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'member_id');
    }

    public function recordedPayments(): HasMany
    {
        return $this->hasMany(Payment::class, 'recorded_by_user_id');
    }
}
