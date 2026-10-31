<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountInvitation extends Model
{
    protected $fillable = ['user_id', 'invited_by_user_id', 'role', 'token_hash', 'expires_at'];
    protected $hidden = ['token_hash'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'accepted_at' => 'datetime', 'revoked_at' => 'datetime'];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function invitedBy(): BelongsTo { return $this->belongsTo(User::class, 'invited_by_user_id'); }

    public function isUsable(): bool
    {
        return $this->accepted_at === null
            && $this->revoked_at === null
            && $this->expires_at->isFuture();
    }
}
