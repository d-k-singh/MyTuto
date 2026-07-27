<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\SubjectCategory;
use Illuminate\Database\Seeder;

/**
 * Seeds the initial subject catalogue for two curricula. Idempotent —
 * re-running updates existing rows in place (matched by category + name)
 * rather than duplicating them, so it's safe to run again after edits here.
 *
 * Run with: php artisan db:seed --class=CurriculumSubjectsSeeder --force
 */
class CurriculumSubjectsSeeder extends Seeder
{
    public function run(): void
    {
        $cbseCategory = SubjectCategory::firstOrCreate(
            ['name' => 'CBSE (India)'],
            ['slug' => SubjectCategory::uniqueSlugFrom('CBSE (India)'), 'is_active' => true],
        );

        $australianCategory = SubjectCategory::firstOrCreate(
            ['name' => 'Australian Curriculum'],
            ['slug' => SubjectCategory::uniqueSlugFrom('Australian Curriculum'), 'is_active' => true],
        );

        // CBSE runs Class 1 through Class 12 uniformly nationwide.
        $cbseGradeLevels = array_map(fn (int $i) => "Class {$i}", range(1, 12));

        foreach (['Hindi', 'English', 'Mathematics', 'Science', 'Sanskrit'] as $name) {
            $this->upsertSubject($cbseCategory->id, $name, $cbseGradeLevels, ['CBSE'], ['IN']);
        }

        // The Australian Curriculum's year levels (Foundation, then Year
        // 1-12) are the same nationally-defined labels used in every
        // state/territory — Years 11-12 are administered under different
        // state senior-secondary certificates (HSC, VCE, QCE, etc.) but
        // the year-level names themselves don't vary by state, and this
        // schema has no state-level field to key off anyway (country is
        // the only geography column available). "All states" is
        // represented here as country-wide availability (countries:
        // ["AU"]) rather than an unsupported per-state breakdown.
        $australianGradeLevels = array_merge(['Foundation'], array_map(fn (int $i) => "Year {$i}", range(1, 12)));

        foreach (['English', 'Mathematics', 'Science'] as $name) {
            $this->upsertSubject($australianCategory->id, $name, $australianGradeLevels, ['Australian Curriculum'], ['AU']);
        }
    }

    /**
     * @param  array<int, string>  $gradeLevels
     * @param  array<int, string>  $examBoards
     * @param  array<int, string>  $countries
     */
    private function upsertSubject(int $categoryId, string $name, array $gradeLevels, array $examBoards, array $countries): void
    {
        $subject = Subject::where('subject_category_id', $categoryId)->where('name', $name)->first();

        $attributes = [
            'grade_levels' => $gradeLevels,
            'exam_boards' => $examBoards,
            'countries' => $countries,
            'is_active' => true,
        ];

        if ($subject) {
            $subject->update($attributes);

            return;
        }

        Subject::create([
            'subject_category_id' => $categoryId,
            'name' => $name,
            'slug' => Subject::uniqueSlugFrom($name),
            ...$attributes,
        ]);
    }
}
