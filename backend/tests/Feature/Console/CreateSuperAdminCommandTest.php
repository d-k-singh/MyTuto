<?php

namespace Tests\Feature\Console;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateSuperAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_a_super_admin(): void
    {
        $this->artisan('app:create-super-admin', [
            '--name' => 'Root Admin',
            '--email' => 'root@example.com',
            '--password' => 'SuperSecret123',
        ])->assertSuccessful();

        $user = User::where('email', 'root@example.com')->firstOrFail();
        $this->assertSame(UserRole::SuperAdmin, $user->role);
        $this->assertTrue(Hash::check('SuperSecret123', $user->password));
    }

    public function test_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'root@example.com']);

        $this->artisan('app:create-super-admin', [
            '--name' => 'Root Admin',
            '--email' => 'root@example.com',
            '--password' => 'SuperSecret123',
        ])->assertFailed();
    }

    public function test_rejects_short_password(): void
    {
        $this->artisan('app:create-super-admin', [
            '--name' => 'Root Admin',
            '--email' => 'root@example.com',
            '--password' => '123',
        ])->assertFailed();

        $this->assertDatabaseMissing('users', ['email' => 'root@example.com']);
    }
}
