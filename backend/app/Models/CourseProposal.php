<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseProposal extends Model
{
    protected $fillable = [
        'coach_id', 'name', 'description', 'suggested_duration_minutes',
        'suggested_capacity', 'status', 'reviewed_by_admin_id',
        'approved_course_id', 'review_note', 'reviewed_at',
    ];

    protected $casts = [
        'suggested_duration_minutes' => 'integer',
        'suggested_capacity' => 'integer',
        'reviewed_at' => 'datetime',
    ];

    public function coach(): BelongsTo { return $this->belongsTo(User::class, 'coach_id'); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewed_by_admin_id'); }
    public function approvedCourse(): BelongsTo { return $this->belongsTo(Course::class, 'approved_course_id'); }
}
