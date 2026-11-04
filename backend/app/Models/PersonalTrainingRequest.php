<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PersonalTrainingRequest extends Model
{
    use HasFactory;

    protected $table = 'personal_training_requests';

    protected $fillable = [
        'member_id',
        'coach_id',
        'request_type',
        'message',
        'preferred_at',
        'status',
        'responded_at',
    ];


    protected $casts = [
        'preferred_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(PersonalSession::class, 'request_id');
    }
}
