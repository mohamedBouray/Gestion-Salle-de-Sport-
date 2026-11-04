<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'subscription_plans';

    protected $fillable = [
        'name',
        'type',
        'course_id',
        'coach_id',
        'duration_value',
        'duration_unit',
        'price',
        'description',
        'status',
    ];


    protected $casts = [
        'duration_value' => 'integer',
        'price' => 'decimal:2',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(MemberSubscription::class, 'plan_id');
    }
}
