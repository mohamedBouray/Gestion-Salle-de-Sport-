<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseEnrollment extends Model
{
    use HasFactory;

    protected $table = 'course_enrollments';

    protected $fillable = [
        'session_id',
        'member_id',
        'price_at_booking',
        'status',
        'enrolled_at',
        'cancelled_at',
    ];


    protected $casts = [
        'price_at_booking' => 'decimal:2',
        'enrolled_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(CourseSession::class, 'session_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'enrollment_id');
    }
}
