<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Comptes Admin / Coach / Member
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->string('email', 190)->unique();
            $table->string('phone', 32)->nullable();
            $table->string('password');
            $table->string('role', 16)->default('member'); 
            $table->string('status', 20)->default('pending');
            $table->timestamp('email_verified_at')->nullable();
            $table->foreignId('created_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['role', 'status'], 'users_role_status_idx');
        });

        // Récupération de mot de passe (Laravel Password Broker)
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email', 190)->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Sessions web / SPA avec SESSION_DRIVER=database
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // Invitation/activation de comptes créés par Admin
        Schema::create('account_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('invited_by_user_id')
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('role', 16);
            $table->char('token_hash', 64)->unique(); 
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'expires_at'], 'inv_user_exp_idx');
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('account_invitations');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};