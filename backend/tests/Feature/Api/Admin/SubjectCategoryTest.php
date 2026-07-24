<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Subject;
use App\Models\SubjectCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubjectCategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_category_with_auto_generated_slug(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/subject-categories', [
            'name' => 'Mathematics & Logic',
        ]);

        $response->assertCreated()
            ->assertJsonPath('category.name', 'Mathematics & Logic')
            ->assertJsonPath('category.slug', 'mathematics-logic')
            ->assertJsonPath('category.is_active', true);
    }

    public function test_rejects_duplicate_category_name(): void
    {
        $admin = User::factory()->admin()->create();
        SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics']);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/subject-categories', [
            'name' => 'Mathematics',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('name');
    }

    public function test_admin_can_list_categories_with_subject_counts(): void
    {
        $admin = User::factory()->admin()->create();
        $category = SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics']);
        Subject::create(['subject_category_id' => $category->id, 'name' => 'Algebra', 'slug' => 'algebra']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/subject-categories');

        $response->assertOk()->assertJsonPath('categories.0.subjects_count', 1);
    }

    public function test_updating_the_name_regenerates_the_slug(): void
    {
        $admin = User::factory()->admin()->create();
        $category = SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics']);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/subject-categories/{$category->id}", ['name' => 'Advanced Mathematics']);

        $response->assertOk()->assertJsonPath('category.slug', 'advanced-mathematics');
    }

    public function test_admin_can_delete_an_empty_category(): void
    {
        $admin = User::factory()->admin()->create();
        $category = SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics']);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/subject-categories/{$category->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('subject_categories', ['id' => $category->id]);
    }

    public function test_cannot_delete_a_category_that_still_has_subjects(): void
    {
        $admin = User::factory()->admin()->create();
        $category = SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics']);
        Subject::create(['subject_category_id' => $category->id, 'name' => 'Algebra', 'slug' => 'algebra']);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/subject-categories/{$category->id}")
            ->assertStatus(409);

        $this->assertDatabaseHas('subject_categories', ['id' => $category->id]);
    }

    public function test_admin_can_activate_and_deactivate_a_category(): void
    {
        $admin = User::factory()->admin()->create();
        $category = SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/subject-categories/{$category->id}/deactivate")
            ->assertOk()->assertJsonPath('category.is_active', false);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/subject-categories/{$category->id}/activate")
            ->assertOk()->assertJsonPath('category.is_active', true);
    }

    public function test_non_admin_cannot_access_these_routes(): void
    {
        $teacher = User::factory()->teacher()->create();

        $this->actingAs($teacher, 'sanctum')->getJson('/api/admin/subject-categories')->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/admin/subject-categories')->assertUnauthorized();
    }
}
