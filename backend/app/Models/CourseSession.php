<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseSession extends Model
{
    use HasFactory;

    protected $table = 'course_sessions';

    protected $fillable = [
        'course_id',
        'coach_id',
        'start_at',
        'end_at',
        'capacity',
        'location',
        'status',
    ];


    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'capacity' => 'integer',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class, 'session_id');
    }

    // Relationship through the enrolments pivot (which has its own Eloquent model).
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'course_enrollments', 'session_id', 'member_id')
            ->withPivot(['id', 'price_at_booking', 'status', 'enrolled_at', 'cancelled_at'])
            ->withTimestamps();
    }
}
