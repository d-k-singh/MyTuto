<?php

namespace App\Http\Requests\Api\Teacher;

use App\Models\Subject;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateTeacherSubjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Ownership (this row belongs to the requesting teacher) is
        // checked in the controller, consistently with the child-profile
        // update pattern.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * subject_id is deliberately not editable here — swapping the subject
     * on an existing offering is a delete-and-recreate, not an update.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'grade_levels' => ['sometimes', 'array', 'min:1'],
            'grade_levels.*' => ['string'],
            'price_per_session_cp' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! $this->has('grade_levels')) {
                return;
            }

            $subject = $this->route('teacherSubject')?->subject;

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
