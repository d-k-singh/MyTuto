<?php

namespace Tests\Feature\Api\Parent;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChildProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_parent_can_create_a_child_profile(): void
    {
        $parent = User::factory()->parent()->create();

        $response = $this->actingAs($parent, 'sanctum')->postJson('/api/parent/children', [
            'full_name' => 'Little Aisha',
            'date_of_birth' => '2015-06-01',
            'gender' => 'female',
            'school_name' => 'Green Valley School',
        ]);

        $response->assertCreated()
            ->assertJsonPath('child.full_name', 'Little Aisha')
            ->assertJsonPath('child.parent_user_id', $parent->id)
            // Parent creating the profile directly is itself the consent.
            ->assertJsonPath('child.parental_consent_given', true)
            ->assertJsonPath('child.user_id', null)
            ->assertJsonPath('child.is_active', true);

        $this->assertDatabaseHas('student_profiles', [
            'full_name' => 'Little Aisha',
            'parent_user_id' => $parent->id,
        ]);
    }

    public function test_create_requires_full_name_and_date_of_birth(): void
    {
        $parent = User::factory()->parent()->create();

        $response = $this->actingAs($parent, 'sanctum')->postJson('/api/parent/children', []);

        $response->assertUnprocessable()->assertJsonValidationErrors(['full_name', 'date_of_birth']);
    }

    public function test_create_rejects_future_date_of_birth(): void
    {
        $parent = User::factory()->parent()->create();

        $response = $this->actingAs($parent, 'sanctum')->postJson('/api/parent/children', [
            'full_name' => 'Little Aisha',
            'date_of_birth' => now()->addDay()->toDateString(),
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('date_of_birth');
    }

    public function test_parent_sees_only_their_own_children_in_index(): void
    {
        $parent = User::factory()->parent()->create();
        $otherParent = User::factory()->parent()->create();

        StudentProfile::create(['parent_user_id' => $parent->id, 'full_name' => 'My Kid', 'date_of_birth' => '2015-01-01']);
        StudentProfile::create(['parent_user_id' => $otherParent->id, 'full_name' => 'Their Kid', 'date_of_birth' => '2015-01-01']);

        $response = $this->actingAs($parent, 'sanctum')->getJson('/api/parent/children');

        $response->assertOk()->assertJsonCount(1, 'children')
            ->assertJsonPath('children.0.full_name', 'My Kid');
    }

    public function test_parent_can_view_own_child(): void
    {
        $parent = User::factory()->parent()->create();
        $child = StudentProfile::create(['parent_user_id' => $parent->id, 'full_name' => 'My Kid', 'date_of_birth' => '2015-01-01']);

        $response = $this->actingAs($parent, 'sanctum')->getJson("/api/parent/children/{$child->id}");

        $response->assertOk()->assertJsonPath('child.full_name', 'My Kid');
    }

    public function test_parent_cannot_view_another_parents_child(): void
    {
        $parent = User::factory()->parent()->create();
        $otherParent = User::factory()->parent()->create();
        $theirChild = StudentProfile::create(['parent_user_id' => $otherParent->id, 'full_name' => 'Their Kid', 'date_of_birth' => '2015-01-01']);

        $this->actingAs($parent, 'sanctum')->getJson("/api/parent/children/{$theirChild->id}")->assertForbidden();
    }

    public function test_parent_can_update_own_child(): void
    {
        $parent = User::factory()->parent()->create();
        $child = StudentProfile::create(['parent_user_id' => $parent->id, 'full_name' => 'My Kid', 'date_of_birth' => '2015-01-01']);

        $response = $this->actingAs($parent, 'sanctum')->putJson("/api/parent/children/{$child->id}", [
            'learning_goal' => 'Exam Prep',
        ]);

        $response->assertOk()->assertJsonPath('child.learning_goal', 'Exam Prep');
    }

    public function test_parent_cannot_update_another_parents_child(): void
    {
        $parent = User::factory()->parent()->create();
        $otherParent = User::factory()->parent()->create();
        $theirChild = StudentProfile::create(['parent_user_id' => $otherParent->id, 'full_name' => 'Their Kid', 'date_of_birth' => '2015-01-01']);

        $this->actingAs($parent, 'sanctum')
            ->putJson("/api/parent/children/{$theirChild->id}", ['learning_goal' => 'Hijacked'])
            ->assertForbidden();

        $this->assertDatabaseMissing('student_profiles', ['id' => $theirChild->id, 'learning_goal' => 'Hijacked']);
    }

    public function test_parent_can_deactivate_and_reactivate_own_child(): void
    {
        $parent = User::factory()->parent()->create();
        $child = StudentProfile::create(['parent_user_id' => $parent->id, 'full_name' => 'My Kid', 'date_of_birth' => '2015-01-01']);

        $this->actingAs($parent, 'sanctum')
            ->patchJson("/api/parent/children/{$child->id}/deactivate")
            ->assertOk()->assertJsonPath('child.is_active', false);

        $this->actingAs($parent, 'sanctum')
            ->patchJson("/api/parent/children/{$child->id}/reactivate")
            ->assertOk()->assertJsonPath('child.is_active', true);
    }

    public function test_parent_cannot_deactivate_another_parents_child(): void
    {
        $parent = User::factory()->parent()->create();
        $otherParent = User::factory()->parent()->create();
        $theirChild = StudentProfile::create(['parent_user_id' => $otherParent->id, 'full_name' => 'Their Kid', 'date_of_birth' => '2015-01-01']);

        $this->actingAs($parent, 'sanctum')
            ->patchJson("/api/parent/children/{$theirChild->id}/deactivate")
            ->assertForbidden();
    }

    public function test_non_parent_cannot_access_children_routes(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student, 'sanctum')->getJson('/api/parent/children')->assertForbidden();
        $this->actingAs($student, 'sanctum')->postJson('/api/parent/children', [])->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/parent/children')->assertUnauthorized();
    }
}
