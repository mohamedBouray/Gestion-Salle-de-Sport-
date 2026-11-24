<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('course_sessions', fn (Blueprint $table) => $table->index(['status', 'start_at'], 'gym_sessions_status_start_idx'));
        Schema::table('course_enrollments', fn (Blueprint $table) => $table->index('created_at', 'gym_enrollments_created_idx'));
        Schema::table('member_subscriptions', fn (Blueprint $table) => $table->index('created_at', 'gym_memberships_created_idx'));
        Schema::table('payments', fn (Blueprint $table) => $table->index('created_at', 'gym_payments_created_idx'));
    }
    public function down(): void
    {
        Schema::table('payments', fn (Blueprint $table) => $table->dropIndex('gym_payments_created_idx'));
        Schema::table('member_subscriptions', fn (Blueprint $table) => $table->dropIndex('gym_memberships_created_idx'));
        Schema::table('course_enrollments', fn (Blueprint $table) => $table->dropIndex('gym_enrollments_created_idx'));
        Schema::table('course_sessions', fn (Blueprint $table) => $table->dropIndex('gym_sessions_status_start_idx'));
    }
};
