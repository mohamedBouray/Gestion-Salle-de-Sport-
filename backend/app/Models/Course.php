<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'courses';

    protected $fillable = [
        'coach_id',
        'created_by_user_id',
        'name',
        'description',
        'price',
        'image',
        'status',
    ];


    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(CourseSession::class, 'course_id');
    }

    public function subscriptionPlans(): HasMany
    {
        return $this->hasMany(SubscriptionPlan::class, 'course_id');
    }
}
