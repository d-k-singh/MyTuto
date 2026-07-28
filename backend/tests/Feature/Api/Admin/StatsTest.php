<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Subject;
use App\Models\SubjectCategory;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_stats(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create();
        $teacher1 = User::factory()->teacher()->create();
        $teacher2 = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $teacher1->id, 'is_approved' => false]);
        TeacherProfile::create(['user_id' => $teacher2->id, 'is_approved' => true]);

        $category = SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics', 'is_active' => true]);
        Subject::create(['subject_category_id' => $category->id, 'name' => 'Algebra', 'slug' => 'algebra', 'is_active' => true]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/stats');

        $response->assertOk()
            ->assertJsonPath('total_users', 4)
            ->assertJsonPath('users_by_role.student', 1)
            ->assertJsonPath('users_by_role.teacher', 2)
            ->assertJsonPath('users_by_role.admin', 1)
            ->assertJsonPath('pending_teacher_approvals', 1)
            ->assertJsonPath('total_subjects', 1);
    }

    public function test_non_admin_cannot_view_stats(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student, 'sanctum')->getJson('/api/admin/stats')->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/admin/stats')->assertUnauthorized();
    }
}
