<?php

namespace App\Http\Requests\Api\Student;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Route-level `role:student` middleware already restricts this to
        // students; the profile being updated is always the current user's.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Note: parent_user_id and parental_consent_given are deliberately not
     * accepted here — a student can't self-declare their own parent link
     * or consent status. Those are set by the parent/admin side of the
     * parental-consent flow (spec 3.1), not yet built.
     *
     * Unlike teachers, students have no minimum age — minors are expected
     * and handled via the parental consent flow, not blocked at signup.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:today', 'after:-100 years'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:50'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'learning_goal' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
