<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\CourseProposal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class GymSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_clean_schema_retains_active_features_and_removes_private_coaching(): void
    {
        $this->assertFalse(Schema::hasTable('personal_sessions'));
        $this->assertFalse(Schema::hasTable('personal_training_requests'));
        $this->assertFalse(Schema::hasColumn('payments', 'personal_session_id'));
        $this->assertFalse(Schema::hasColumn('subscription_plans', 'coach_id'));
        $this->assertTrue(Schema::hasColumns('course_enrollments', ['attendance_status', 'attendance_marked_at', 'attendance_marked_by_user_id']));
        $this->assertTrue(Schema::hasTable('cache'));
        $this->assertTrue(Schema::hasTable('cache_locks'));

        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $coach = User::factory()->create(['role' => 'coach', 'status' => 'active']);
        CourseProposal::create(['coach_id' => $coach->id, 'name' => 'Yoga', 'status' => 'pending']);
        $this->actingAs($admin)->getJson('/api/admin/coaches/'.$coach->id)
            ->assertOk()->assertJsonPath('coach.course_proposals_count', 1);
    }
}
