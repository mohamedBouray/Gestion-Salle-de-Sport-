<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoachAvailability extends Model
{
    use HasFactory;

    protected $table = 'coach_availabilities';

    protected $fillable = [
        'coach_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_active',
    ];


    protected $casts = [
        'day_of_week' => 'integer',
        'is_active' => 'boolean',
    ];

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }
}
