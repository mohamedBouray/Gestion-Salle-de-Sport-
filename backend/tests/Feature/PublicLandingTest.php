<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseSession;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicLandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_landing_shows_real_featured_courses_and_three_active_offers(): void
    {
        $coach = User::factory()->create(['role' => 'coach', 'status' => 'active']);
        $coach->coachProfile()->create(['specialty' => 'Fitness', 'is_featured' => true]);
        $other = User::factory()->create(['role' => 'coach', 'status' => 'active']);
        $course = Course::create(['name' => 'Boxe', 'coach_id' => $coach->id, 'status' => 'active']);
        $withoutSession = Course::create(['name' => 'Yoga', 'coach_id' => $coach->id, 'status' => 'active']);
        $inactive = Course::create(['name' => 'Inactive', 'coach_id' => $coach->id, 'status' => 'inactive']);
        Course::create(['name' => 'Autre coach', 'coach_id' => $other->id, 'status' => 'active']);

        $start = now('UTC')->addDay();
        $session = CourseSession::create([
            'course_id' => $course->id, 'coach_id' => $coach->id,
            'start_at' => $start, 'end_at' => $start->copy()->addHour(),
            'status' => 'scheduled', 'capacity' => 12, 'location' => 'Salle 1',
        ]);
        $member = User::factory()->create(['role' => 'member', 'status' => 'active']);
        $session->enrollments()->create([
            'member_id' => $member->id, 'price_at_booking' => 0,
            'status' => 'confirmed', 'enrolled_at' => now('UTC'),
        ]);
        $plan = fn ($name, $type, $price, $status = 'active', $courseId = null) => SubscriptionPlan::create([
            'name' => $name, 'type' => $type, 'price' => $price, 'status' => $status,
            'course_id' => $courseId, 'duration_unit' => 'month', 'duration_value' => 1,
        ]);
        $first = $plan('Général A', 'general', 300);
        $second = $plan('Général B', 'general', 400);
        $specific = $plan('Boxe mensuel', 'course', 200, 'active', $course->id);
        $plan('Général C', 'general', 500);
        $plan('Inactif', 'general', 1, 'inactive');
        $plan('Cours indisponible', 'course', 1, 'active', $inactive->id);

        $response = $this->getJson('/api/site-settings')->assertOk()
            ->assertJsonPath('settings.featured_coach.id', $coach->id)
            ->assertJsonPath('settings.featured_coach.courses_count', 2)
            ->assertJsonCount(2, 'settings.classes_items')
            ->assertJsonPath('settings.classes_items.0.id', $course->id)
            ->assertJsonPath('settings.classes_items.0.session_id', $session->id)
            ->assertJsonPath('settings.classes_items.0.enrolled', 1)
            ->assertJsonPath('settings.classes_items.0.capacity', 12)
            ->assertJsonPath('settings.classes_items.1.id', $withoutSession->id)
            ->assertJsonPath('settings.classes_items.1.session_id', null)
            ->assertJsonCount(3, 'settings.pricing_plans');
        $this->assertSame([$first->id, $second->id, $specific->id], array_column($response->json('settings.pricing_plans'), 'id'));
    }

    public function test_public_landing_has_no_fake_offers_or_inactive_featured_coach(): void
    {
        $coach = User::factory()->create(['role' => 'coach', 'status' => 'inactive']);
        $coach->coachProfile()->create(['specialty' => 'Fitness', 'is_featured' => true]);
        $this->getJson('/api/site-settings')->assertOk()
            ->assertJsonPath('settings.featured_coach', null)
            ->assertJsonCount(0, 'settings.classes_items')
            ->assertJsonCount(0, 'settings.pricing_plans');
    }
    public function test_public_settings_cache_is_invalidated_after_admin_update(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $this->getJson('/api/site-settings')->assertOk();
        $this->actingAs($admin)->putJson('/api/admin/site-settings', [
            'settings' => ['site_name' => 'Bouray Gym Updated'],
        ])->assertOk();
        $this->getJson('/api/site-settings')->assertOk()->assertJsonPath('settings.site_name', 'Bouray Gym Updated');
    }
}
