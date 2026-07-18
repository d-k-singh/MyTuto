<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_register_and_gets_a_teacher_profile(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Priya Sharma',
            'email' => 'priya@example.com',
            'password' => 'Passw0rd!',
            'password_confirmation' => 'Passw0rd!',
            'role' => 'teacher',
        ]);

        $response->assertCreated()->assertJsonStructure(['user', 'token']);

        $user = User::where('email', 'priya@example.com')->firstOrFail();
        $this->assertSame(UserRole::Teacher, $user->role);
        $this->assertNotNull($user->teacherProfile);
        $this->assertNull($user->studentProfile);
    }

    public function test_registration_rejects_non_self_registerable_roles(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Hacker',
            'email' => 'hacker@example.com',
            'password' => 'Passw0rd!',
            'password_confirmation' => 'Passw0rd!',
            'role' => 'super_admin',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('role');
        $this->assertDatabaseMissing('users', ['email' => 'hacker@example.com']);
    }

    public function test_registration_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'priya@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Someone Else',
            'email' => 'priya@example.com',
            'password' => 'Passw0rd!',
            'password_confirmation' => 'Passw0rd!',
            'role' => 'student',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_user_can_login_with_correct_credentials(): void
    {
        User::factory()->create([
            'email' => 'priya@example.com',
            'password' => bcrypt('Passw0rd!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'priya@example.com',
            'password' => 'Passw0rd!',
        ]);

        $response->assertOk()->assertJsonStructure(['user', 'token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create(['email' => 'priya@example.com']);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'priya@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_login_fails_for_deactivated_account(): void
    {
        User::factory()->create([
            'email' => 'priya@example.com',
            'password' => bcrypt('Passw0rd!'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'priya@example.com',
            'password' => 'Passw0rd!',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_authenticated_user_can_fetch_own_profile(): void
    {
        $user = User::factory()->teacher()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/auth/me');

        $response->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_unauthenticated_request_to_me_is_rejected(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_logout_revokes_the_current_token(): void
    {
        $user = User::factory()->create();
        $tokenResult = $user->createToken('api');

        $this->withHeader('Authorization', "Bearer {$tokenResult->plainTextToken}")
            ->postJson('/api/auth/logout')
            ->assertOk();

        // Asserted against the database directly, rather than a second
        // simulated request with the same token — Laravel's HTTP testing
        // helpers don't reboot the app container (and its cached auth
        // guard state) between chained calls within a single test method,
        // which can mask revocation that a real second HTTP request
        // (verified manually against a live server) correctly rejects.
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $tokenResult->accessToken->id,
        ]);
    }
}
