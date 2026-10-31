<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordResetToken extends Model
{
    protected $table = 'password_reset_tokens';
    protected $primaryKey = 'email';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $guarded = ['*'];
    protected $hidden = ['token'];

    protected function casts(): array { return ['created_at' => 'datetime']; }
}
