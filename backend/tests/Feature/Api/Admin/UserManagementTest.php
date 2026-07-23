<?php

namespace Tests\Feature\Api\Admin;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_users(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(3)->student()->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users');

        $response->assertOk();
        // 3 students + the admin itself.
        $this->assertSame(4, $response->json('total'));
    }

    public function test_can_filter_users_by_role(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(2)->teacher()->create();
        User::factory()->count(3)->student()->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users?role=teacher');

        $response->assertOk();
        $this->assertSame(2, $response->json('total'));
    }

    public function test_can_filter_users_by_active_status(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->student()->create(['is_active' => true]);
        User::factory()->student()->create(['is_active' => false]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users?is_active=0');

        $response->assertOk();
        $this->assertSame(1, $response->json('total'));
    }

    public function test_can_search_users_by_name_or_email(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->student()->create(['name' => 'Aisha Rahman', 'email' => 'aisha@example.com']);
        User::factory()->student()->create(['name' => 'Someone Else', 'email' => 'else@example.com']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users?search=aisha');

        $response->assertOk();
        $this->assertSame(1, $response->json('total'));
    }

    public function test_admin_can_view_a_user_with_profile_loaded(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $teacher->id, 'display_name' => 'Ms. Sharma']);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/admin/users/{$teacher->id}");

        $response->assertOk()->assertJsonPath('user.teacher_profile.display_name', 'Ms. Sharma');
    }

    public function test_admin_can_deactivate_and_reactivate_a_user(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->teacher()->create();
        $teacher->createToken('api');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$teacher->id}/deactivate")
            ->assertOk()->assertJsonPath('user.is_active', false);

        // Deactivating revokes existing tokens — asserted against the
        // database directly rather than a second simulated request with
        // the same token (see the note in AuthTest::test_logout_revokes_
        // the_current_token for why chained requests in one test method
        // aren't reliable for this).
        $this->assertDatabaseCount('personal_access_tokens', 0);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$teacher->id}/activate")
            ->assertOk()->assertJsonPath('user.is_active', true);
    }

    public function test_admin_cannot_deactivate_their_own_account(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$admin->id}/deactivate")
            ->assertStatus(422);

        $this->assertDatabaseHas('users', ['id' => $admin->id, 'is_active' => true]);
    }

    public function test_super_admin_also_has_access(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();

        $this->actingAs($superAdmin, 'sanctum')->getJson('/api/admin/users')->assertOk();
    }

    public function test_non_admin_roles_cannot_access_admin_routes(): void
    {
        $teacher = User::factory()->teacher()->create();
        $student = User::factory()->student()->create();
        $parent = User::factory()->parent()->create();

        $this->actingAs($teacher, 'sanctum')->getJson('/api/admin/users')->assertForbidden();
        $this->actingAs($student, 'sanctum')->getJson('/api/admin/users')->assertForbidden();
        $this->actingAs($parent, 'sanctum')->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();
    }
}
