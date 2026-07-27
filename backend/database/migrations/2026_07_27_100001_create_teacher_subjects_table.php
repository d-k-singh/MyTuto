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
        Schema::create('teacher_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_profile_id')->constrained()->cascadeOnDelete();
            // restrictOnDelete, matching subjects.subject_category_id — an
            // admin shouldn't be able to silently orphan a teacher's
            // pricing/grade-level data by deleting a subject out from
            // under it.
            $table->foreignId('subject_id')->constrained()->restrictOnDelete();
            // Which of the subject's grade levels this teacher offers it
            // at — required, not nullable, so the matching engine never
            // has to guard against a null array here.
            $table->json('grade_levels');
            $table->unsignedInteger('price_per_session_cp');
            $table->timestamps();

            $table->unique(['teacher_profile_id', 'subject_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_subjects');
    }
};
