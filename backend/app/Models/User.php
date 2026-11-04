<?php

namespace App\Models;

use App\Models\Concerns\HasGymRelationships;

use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory;
    use Notifiable;
    use SoftDeletes;
    use MustVerifyEmailTrait;
    use HasGymRelationships;

    // Roles
    public const ADMIN = 'admin';
    public const COACH = 'coach';
    public const MEMBER = 'member';

    // Mass assignment
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
    ];

    // Hidden attributes
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Casts
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // =====================================
    // AUTHENTICATION RELATIONSHIPS
    // =====================================

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(
            self::class,
            'created_by_user_id'
        );
    }

    public function createdUsers(): HasMany
    {
        return $this->hasMany(
            self::class,
            'created_by_user_id'
        );
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(
            AccountInvitation::class,
            'user_id'
        );
    }

    public function sentInvitations(): HasMany
    {
        return $this->hasMany(
            AccountInvitation::class,
            'invited_by_user_id'
        );
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(
            UserSession::class,
            'user_id'
        );
    }

    // =====================================
    // COACH PROFILE
    // =====================================

    public function coachProfile(): HasOne
    {
        return $this->hasOne(
            CoachProfile::class,
            'user_id'
        );
    }

    // =====================================
    // ROLE HELPERS
    // =====================================

    public function isAdmin(): bool
    {
        return $this->role === self::ADMIN;
    }

    public function isCoach(): bool
    {
        return $this->role === self::COACH;
    }

    public function isMember(): bool
    {
        return $this->role === self::MEMBER;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
