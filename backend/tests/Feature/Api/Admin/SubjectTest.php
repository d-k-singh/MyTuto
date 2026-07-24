<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Subject;
use App\Models\SubjectCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SubjectTest extends TestCase
{
    use RefreshDatabase;

    private function category(string $name = 'Mathematics'): SubjectCategory
    {
        return SubjectCategory::create(['name' => $name, 'slug' => Str::slug($name)]);
    }

    public function test_admin_can_create_a_subject_with_curriculum_metadata(): void
    {
        $admin = User::factory()->admin()->create();
        $category = $this->category();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/subjects', [
            'subject_category_id' => $category->id,
            'name' => 'Algebra',
            'description' => 'Foundational algebra.',
            'grade_levels' => ['Grade 9', 'Grade 10'],
            'exam_boards' => ['IB', 'Cambridge IGCSE'],
            'countries' => ['IN', 'US'],
        ]);

        $response->assertCreated()
            ->assertJsonPath('subject.name', 'Algebra')
            ->assertJsonPath('subject.slug', 'algebra')
            ->assertJsonPath('subject.category.id', $category->id)
            ->assertJsonPath('subject.grade_levels', ['Grade 9', 'Grade 10'])
            ->assertJsonPath('subject.is_active', true);
    }

    public function test_rejects_duplicate_name_within_the_same_category(): void
    {
        $admin = User::factory()->admin()->create();
        $category = $this->category();
        Subject::create(['subject_category_id' => $category->id, 'name' => 'Algebra', 'slug' => 'algebra']);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/subjects', [
            'subject_category_id' => $category->id,
            'name' => 'Algebra',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('name');
    }

    public function test_allows_the_same_name_in_a_different_category(): void
    {
        $admin = User::factory()->admin()->create();
        $math = $this->category('Mathematics');
        $science = $this->category('Science');
        Subject::create(['subject_category_id' => $math->id, 'name' => 'Statistics', 'slug' => 'statistics']);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/subjects', [
            'subject_category_id' => $science->id,
            'name' => 'Statistics',
        ]);

        $response->assertCreated();
    }

    public function test_rejects_invalid_category_id(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/subjects', [
            'subject_category_id' => 99999,
            'name' => 'Algebra',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('subject_category_id');
    }

    public function test_admin_can_list_and_filter_subjects(): void
    {
        $admin = User::factory()->admin()->create();
        $math = $this->category('Mathematics');
        $science = $this->category('Science');
        Subject::create(['subject_category_id' => $math->id, 'name' => 'Algebra', 'slug' => 'algebra']);
        Subject::create(['subject_category_id' => $science->id, 'name' => 'Physics', 'slug' => 'physics']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/subjects?subject_category_id={$math->id}");

        $response->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.name', 'Algebra');
    }

    public function test_admin_can_update_a_subject_and_move_it_to_another_category(): void
    {
        $admin = User::factory()->admin()->create();
        $math = $this->category('Mathematics');
        $science = $this->category('Science');
        $subject = Subject::create(['subject_category_id' => $math->id, 'name' => 'Statistics', 'slug' => 'statistics']);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/subjects/{$subject->id}", ['subject_category_id' => $science->id]);

        $response->assertOk()->assertJsonPath('subject.category.id', $science->id);
    }

    public function test_admin_can_delete_a_subject(): void
    {
        $admin = User::factory()->admin()->create();
        $category = $this->category();
        $subject = Subject::create(['subject_category_id' => $category->id, 'name' => 'Algebra', 'slug' => 'algebra']);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/subjects/{$subject->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('subjects', ['id' => $subject->id]);
    }

    public function test_admin_can_activate_and_deactivate_a_subject(): void
    {
        $admin = User::factory()->admin()->create();
        $category = $this->category();
        $subject = Subject::create(['subject_category_id' => $category->id, 'name' => 'Algebra', 'slug' => 'algebra']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/subjects/{$subject->id}/deactivate")
            ->assertOk()->assertJsonPath('subject.is_active', false);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/subjects/{$subject->id}/activate")
            ->assertOk()->assertJsonPath('subject.is_active', true);
    }

    public function test_non_admin_cannot_access_these_routes(): void
    {
        $teacher = User::factory()->teacher()->create();

        $this->actingAs($teacher, 'sanctum')->getJson('/api/admin/subjects')->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/admin/subjects')->assertUnauthorized();
    }
}
