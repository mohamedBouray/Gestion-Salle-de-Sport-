<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $table = 'payments';

    protected $fillable = [
        'member_id',
        'subscription_id',
        'enrollment_id',
        'personal_session_id',
        'recorded_by_user_id',
        'amount',
        'method',
        'status',
        'paid_at',
        'reference',
        'notes',
    ];


    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(MemberSubscription::class, 'subscription_id');
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(CourseEnrollment::class, 'enrollment_id');
    }

    public function personalSession(): BelongsTo
    {
        return $this->belongsTo(PersonalSession::class, 'personal_session_id');
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }

    // Exactly ONE of subscription_id / enrollment_id / personal_session_id
    // must be set by the validated controller or service (not by Eloquent).
}
