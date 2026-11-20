<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('course_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coach_id')->constrained('users')->restrictOnDelete();
            $table->string('name', 160);
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('suggested_duration_minutes')->nullable();
            $table->unsignedSmallInteger('suggested_capacity')->nullable();
            $table->string('status', 20)->default('pending'); // pending, approved, rejected
            $table->foreignId('reviewed_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['coach_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_proposals');
    }
};
