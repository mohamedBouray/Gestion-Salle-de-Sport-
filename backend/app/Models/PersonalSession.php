<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PersonalSession extends Model
{
    use HasFactory;

    protected $table = 'personal_sessions';

    protected $fillable = [
        'request_id',
        'scheduled_at',
        'duration_minutes',
        'price',
        'location',
        'status',
        'notes',
    ];


    protected $casts = [
        'scheduled_at' => 'datetime',
        'duration_minutes' => 'integer',
        'price' => 'decimal:2',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(PersonalTrainingRequest::class, 'request_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'personal_session_id');
    }

    // Member and coach are accessed through $session->request->member / ->coach.
    // personal_sessions has NO member_id or coach_id columns.
}
