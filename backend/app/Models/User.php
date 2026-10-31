<?php
namespace App\Models;

use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, SoftDeletes, MustVerifyEmailTrait;

    public const ADMIN = 'admin';
    public const COACH = 'coach';
    public const MEMBER = 'member';
    protected $fillable = ['name', 'email', 'phone', 'password'];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'password' => 'hashed'];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'created_by_user_id');
    }

    public function createdUsers(): HasMany
    {
        return $this->hasMany(self::class, 'created_by_user_id');
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(AccountInvitation::class, 'user_id');
    }

    public function sentInvitations(): HasMany
    {
        return $this->hasMany(AccountInvitation::class, 'invited_by_user_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(UserSession::class, 'user_id');
    }

    public function isAdmin(): bool { return $this->role === self::ADMIN; }
    public function isCoach(): bool { return $this->role === self::COACH; }
    public function isMember(): bool { return $this->role === self::MEMBER; }
    public function isActive(): bool { return $this->status === 'active'; }
}
