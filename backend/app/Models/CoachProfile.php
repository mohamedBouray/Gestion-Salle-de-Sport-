<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoachProfile extends Model
{
    use HasFactory;

    protected $table = 'coach_profiles';

    protected $fillable = [
        'user_id',
        'specialty',
        'bio',
        'photo',
        'experience_years',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'experience_years' => 'integer',
            'is_featured' => 'boolean',
        ];
    }

    // Coach propriétaire du profil
    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
