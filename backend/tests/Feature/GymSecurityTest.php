<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class GymSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_requires_verified_email_before_member_login(): void
    {
        Notification::fake();
        User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $this->withHeader('Origin', 'http://localhost:3000');
        $this->postJson('/api/register', [
            'name' => 'Demo Member', 'email' => 'newmember@example.test',
            'password' => 'TestPassword12', 'password_confirmation' => 'TestPassword12',
        ])->assertCreated()->assertJsonPath('verification_required', true);
        $member = User::where('email', 'newmember@example.test')->firstOrFail();
        Notification::assertSentTo($member, VerifyEmail::class);
        $this->assertNull($member->email_verified_at);
        $this->postJson('/api/login', ['email' => $member->email, 'password' => 'TestPassword12'])
            ->assertForbidden()->assertJsonPath('code', 'EMAIL_UNVERIFIED');
        $parameters = ['id' => $member->id, 'hash' => sha1($member->email)];
        $expired = URL::temporarySignedRoute('verification.verify', now()->subMinute(), $parameters, absolute: false);
        $this->get($expired)->assertForbidden();
        $valid = URL::temporarySignedRoute('verification.verify', now()->addHour(), $parameters, absolute: false);
        $this->get($valid.'&tampered=1')->assertForbidden();
        $this->get($valid)->assertRedirect(rtrim(config('gym.frontend_url'), '/').'/login?verified=1');
        $this->assertNotNull($member->fresh()->email_verified_at);
        $this->postJson('/api/login', ['email' => $member->email, 'password' => 'TestPassword12'])
            ->assertOk()->assertJsonPath('user.role', 'member');
    }

    public function test_unverified_existing_session_cannot_access_member_routes(): void
    {
        $member = User::factory()->unverified()->create(['role' => 'member', 'status' => 'active']);
        $this->actingAs($member)->getJson('/api/member/courses')->assertForbidden()
            ->assertJsonPath('code', 'EMAIL_UNVERIFIED');
    }

    public function test_roles_cannot_access_other_role_dashboards(): void
    {
        $member = User::factory()->create(['role' => 'member', 'status' => 'active']);
        $coach = User::factory()->create(['role' => 'coach', 'status' => 'active']);
        $this->actingAs($member)->getJson('/api/admin/dashboard')->assertForbidden();
        $this->actingAs($coach)->getJson('/api/member/dashboard')->assertForbidden();
        $this->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_coach_blocking_revokes_sessions_and_remember_token(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $coach = User::factory()->create(['role' => 'coach', 'status' => 'active']);
        DB::table('sessions')->insert([
            'id' => 'coach-security-session', 'user_id' => $coach->id,
            'payload' => '', 'last_activity' => time(),
        ]);
        $this->actingAs($admin)->putJson('/api/admin/coaches/'.$coach->id, ['status' => 'inactive'])->assertOk();
        $this->assertNull($coach->fresh()->remember_token);
        $this->assertDatabaseMissing('sessions', ['id' => 'coach-security-session']);
        $this->actingAs($coach->fresh())->getJson('/api/coach/dashboard')->assertForbidden();
    }
}
