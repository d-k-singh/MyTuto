<?php

namespace App\Http\Requests\Api\Teacher;

use App\Models\Subject;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTeacherSubjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Route-level `role:teacher` middleware already restricts this to
        // teachers; the row created always belongs to the current user's
        // own teacher profile.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'subject_id' => [
                'required',
                'integer',
                'exists:subjects,id',
                Rule::unique('teacher_subjects')->where('teacher_profile_id', $this->user()->teacherProfile->id),
            ],
            'grade_levels' => ['required', 'array', 'min:1'],
            'grade_levels.*' => ['string'],
            'price_per_session_cp' => ['required', 'integer', 'min:1'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $subject = Subject::find($this->input('subject_id'));

            // Only cross-check against the subject's own catalogued grade
            // levels when it has any — an admin may not have tagged them
            // yet, and that shouldn't block a teacher from offering the
            // subject.
            if (! $subject || empty($subject->grade_levels)) {
                return;
            }

            $invalid = array_diff((array) $this->input('grade_levels', []), $subject->grade_levels);

            if ($invalid !== []) {
                $validator->errors()->add(
                    'grade_levels',
                    'These grade levels are not offered for this subject: '.implode(', ', $invalid)
                );
            }
        });
    }
}
