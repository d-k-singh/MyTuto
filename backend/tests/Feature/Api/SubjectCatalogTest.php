<?php

namespace Tests\Feature\Api;

use App\Models\Subject;
use App\Models\SubjectCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubjectCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_list_active_categories_without_authentication(): void
    {
        SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics', 'is_active' => true]);
        SubjectCategory::create(['name' => 'Retired Category', 'slug' => 'retired-category', 'is_active' => false]);

        $response = $this->getJson('/api/subject-categories');

        $response->assertOk()->assertJsonCount(1, 'categories')
            ->assertJsonPath('categories.0.name', 'Mathematics');
    }

    public function test_public_can_list_active_subjects_without_authentication(): void
    {
        $category = SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics', 'is_active' => true]);
        Subject::create(['subject_category_id' => $category->id, 'name' => 'Algebra', 'slug' => 'algebra', 'is_active' => true]);
        Subject::create(['subject_category_id' => $category->id, 'name' => 'Retired Subject', 'slug' => 'retired-subject', 'is_active' => false]);

        $response = $this->getJson('/api/subjects');

        $response->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.name', 'Algebra');
    }

    public function test_subjects_under_an_inactive_category_are_hidden_even_if_the_subject_itself_is_active(): void
    {
        $category = SubjectCategory::create(['name' => 'Retired Category', 'slug' => 'retired-category', 'is_active' => false]);
        Subject::create(['subject_category_id' => $category->id, 'name' => 'Algebra', 'slug' => 'algebra', 'is_active' => true]);

        $response = $this->getJson('/api/subjects');

        $response->assertOk()->assertJsonPath('total', 0);
    }

    public function test_can_filter_public_subjects_by_category(): void
    {
        $math = SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics', 'is_active' => true]);
        $science = SubjectCategory::create(['name' => 'Science', 'slug' => 'science', 'is_active' => true]);
        Subject::create(['subject_category_id' => $math->id, 'name' => 'Algebra', 'slug' => 'algebra', 'is_active' => true]);
        Subject::create(['subject_category_id' => $science->id, 'name' => 'Physics', 'slug' => 'physics', 'is_active' => true]);

        $response = $this->getJson("/api/subjects?subject_category_id={$math->id}");

        $response->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.name', 'Algebra');
    }
}
