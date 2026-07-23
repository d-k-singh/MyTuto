<?php

namespace Tests\Feature\Api\Parent;

use App\Models\ParentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParentProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_parent_can_view_own_profile(): void
    {
        $user = User::factory()->parent()->create();
        ParentProfile::create(['user_id' => $user->id, 'relationship_to_child' => 'mother']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/parent/profile');

        $response->assertOk()->assertJsonPath('profile.relationship_to_child', 'mother');
    }

    public function test_parent_can_update_own_profile_including_credit_spend_limit(): void
    {
        $user = User::factory()->parent()->create();
        ParentProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/parent/profile', [
            'relationship_to_child' => 'father',
            'country' => 'India',
            'city' => 'Delhi',
            'credit_spend_limit' => 500,
        ]);

        $response->assertOk()
            ->assertJsonPath('profile.relationship_to_child', 'father')
            ->assertJsonPath('profile.city', 'Delhi')
            ->assertJsonPath('profile.credit_spend_limit', '500.00');

        $this->assertDatabaseHas('parent_profiles', [
            'user_id' => $user->id,
            'city' => 'Delhi',
        ]);
    }

    public function test_update_rejects_invalid_relationship_value(): void
    {
        $user = User::factory()->parent()->create();
        ParentProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/parent/profile', [
            'relationship_to_child' => 'uncle',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('relationship_to_child');
    }

    public function test_update_rejects_negative_credit_spend_limit(): void
    {
        $user = User::factory()->parent()->create();
        ParentProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/parent/profile', [
            'credit_spend_limit' => -50,
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('credit_spend_limit');
    }

    public function test_completion_percentage_excludes_credit_spend_limit(): void
    {
        $user = User::factory()->parent()->create();
        ParentProfile::create(['user_id' => $user->id]);

        // All 3 completion fields filled in, credit_spend_limit left null.
        $response = $this->actingAs($user, 'sanctum')->putJson('/api/parent/profile', [
            'relationship_to_child' => 'mother',
            'country' => 'India',
            'city' => 'Delhi',
        ]);

        $response->assertOk()->assertJsonPath('profile.completion_percentage', 100);
    }

    public function test_student_cannot_access_parent_profile_routes(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student, 'sanctum')->getJson('/api/parent/profile')->assertForbidden();
        $this->actingAs($student, 'sanctum')->putJson('/api/parent/profile', [])->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/parent/profile')->assertUnauthorized();
    }
}
