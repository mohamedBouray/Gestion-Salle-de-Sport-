
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->string('attendance_status', 16)
                ->nullable()
                ->after('status');

            $table->timestamp('attendance_marked_at')
                ->nullable()
                ->after('attendance_status');

            $table->foreignId('attendance_marked_by_user_id')
                ->nullable()
                ->after('attendance_marked_at')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->dropForeign(['attendance_marked_by_user_id']);

            $table->dropColumn([
                'attendance_status',
                'attendance_marked_at',
                'attendance_marked_by_user_id',
            ]);
        });
    }
};
