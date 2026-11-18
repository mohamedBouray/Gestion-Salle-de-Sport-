<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gym_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('role', 16); // member, coach (snapshot du type de pointage)
            $table->date('date'); // jour métier dans le fuseau de la salle
            $table->dateTime('check_in_at')->nullable(); // UTC
            $table->dateTime('check_out_at')->nullable(); // UTC
            $table->string('status', 16); // present, left, absent
            $table->text('note')->nullable();
            $table->foreignId('recorded_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['role', 'date', 'status'], 'gym_att_role_date_status_idx');
            $table->index(['user_id', 'date'], 'gym_att_user_date_idx');
            $table->index(['user_id', 'status'], 'gym_att_user_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gym_attendances');
    }
};
