<?php

namespace App\Http\Requests\Api\Teacher;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeacherProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Route-level `role:teacher` middleware already restricts this to
        // teachers; the profile being updated is always the current user's.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Note: verification/approval flags (identity_verified,
     * education_verified, background_check_passed, is_approved) are
     * deliberately not accepted here — those are admin/system-controlled
     * and must never be self-editable by the teacher.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'display_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:-18 years'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:50'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'teaching_mode' => ['sometimes', 'nullable', Rule::in(['online', 'in_person', 'hybrid'])],
            'years_experience' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:80'],
        ];
    }
}
