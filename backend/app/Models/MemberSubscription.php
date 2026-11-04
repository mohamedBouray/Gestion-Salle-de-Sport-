<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MemberSubscription extends Model
{
    use HasFactory;

    protected $table = 'member_subscriptions';

    protected $fillable = [
        'member_id',
        'plan_id',
        'starts_at',
        'ends_at',
        'price_at_purchase',
        'status',
    ];


    protected $casts = [
        'starts_at' => 'date',
        'ends_at' => 'date',
        'price_at_purchase' => 'decimal:2',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'subscription_id');
    }
}
