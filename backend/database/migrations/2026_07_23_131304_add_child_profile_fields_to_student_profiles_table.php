<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            // A "child profile" (spec 4.2) is created directly by a parent
            // and has no login of its own — user_id is only set once/if a
            // student later registers their own account (or an older
            // self-registering student is linked to a parent).
            $table->foreignId('user_id')->nullable()->change();

            $table->string('full_name')->nullable()->after('user_id');
            $table->string('school_name')->nullable()->after('learning_goal');
            $table->boolean('is_active')->default(true)->after('parental_consent_given');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropColumn(['full_name', 'school_name', 'is_active']);
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};
