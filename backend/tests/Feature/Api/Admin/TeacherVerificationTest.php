<?php

namespace Tests\Feature\Api\Admin;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_issue_verification_badges(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->teacher()->create();
        $profile = TeacherProfile::create(['user_id' => $teacher->id]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/teachers/{$profile->id}/verification", [
                'identity_verified' => true,
                'education_verified' => true,
            ]);

        $response->assertOk()
            ->assertJsonPath('profile.identity_verified', true)
            ->assertJsonPath('profile.education_verified', true)
            ->assertJsonPath('profile.background_check_passed', false);
    }

    public function test_admin_can_revoke_a_previously_issued_badge(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->teacher()->create();
        $profile = TeacherProfile::create(['user_id' => $teacher->id, 'identity_verified' => true]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/teachers/{$profile->id}/verification", [
                'identity_verified' => false,
            ]);

        $response->assertOk()->assertJsonPath('profile.identity_verified', false);
    }

    public function test_admin_can_approve_and_reject_a_teacher(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->teacher()->create();
        $profile = TeacherProfile::create(['user_id' => $teacher->id]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/teachers/{$profile->id}/approve")
            ->assertOk()->assertJsonPath('profile.is_approved', true);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/teachers/{$profile->id}/reject")
            ->assertOk()->assertJsonPath('profile.is_approved', false);
    }

    public function test_non_admin_roles_cannot_access_these_routes(): void
    {
        $teacher = User::factory()->teacher()->create();
        $profile = TeacherProfile::create(['user_id' => $teacher->id]);

        $this->actingAs($teacher, 'sanctum')
            ->patchJson("/api/admin/teachers/{$profile->id}/approve")
            ->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $teacher = User::factory()->teacher()->create();
        $profile = TeacherProfile::create(['user_id' => $teacher->id]);

        $this->patchJson("/api/admin/teachers/{$profile->id}/approve")->assertUnauthorized();
    }
}
