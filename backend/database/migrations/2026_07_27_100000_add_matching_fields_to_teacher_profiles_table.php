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
        Schema::table('teacher_profiles', function (Blueprint $table) {
            // Matching-engine inputs (spec: student-teacher matching) —
            // kept as simple JSON tag lists, same pattern as
            // subjects.grade_levels/exam_boards/countries.
            $table->json('languages')->nullable()->after('teaching_mode');
            $table->json('available_time_blocks')->nullable()->after('languages');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->dropColumn(['languages', 'available_time_blocks']);
        });
    }
};
