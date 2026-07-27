<?php

namespace App\Http\Requests\Api;

use App\Enums\TimeBlock;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TutorSearchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Route-level `role:student,parent` middleware already restricts
        // this to students/parents.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * The search form always submits a value for every field (gender
     * preference defaults to "no_preference" in the UI, and an "Other"
     * language pick is resolved to its free-text value client-side before
     * submitting) — so these are required rather than optional-with-a-
     * neutral-fallback, keeping the scoring logic in TutorMatchScorer free
     * of "what does an absent field mean" ambiguity.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'grade_level' => ['required', 'string', 'max:100'],
            'language' => ['required', 'string', 'max:100'],
            'geographic_preference' => ['required', Rule::in(['local', 'international'])],
            'budget_max' => ['required', 'integer', 'min:1'],
            'gender_preference' => ['sometimes', Rule::in(['male', 'female', 'no_preference'])],
            'teaching_mode' => ['required', Rule::in(['online', 'in_person', 'hybrid'])],
            'time_block' => ['required', Rule::in(TimeBlock::values())],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    public function genderPreference(): string
    {
        return $this->input('gender_preference', 'no_preference');
    }
}
