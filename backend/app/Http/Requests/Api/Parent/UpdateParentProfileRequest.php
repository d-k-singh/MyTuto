<?php

namespace App\Http\Requests\Api\Parent;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateParentProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Route-level `role:parent` middleware already restricts this to
        // parents; the profile being updated is always the current user's.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Unlike teacher/student profiles, every field here is genuinely the
     * parent's own setting on their own account — credit_spend_limit is a
     * parental control the parent sets themselves (spec 4.1), not an
     * admin-controlled flag — so nothing needs to be excluded from
     * self-update.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'relationship_to_child' => ['sometimes', 'nullable', Rule::in(['mother', 'father', 'guardian', 'other'])],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'credit_spend_limit' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999999.99'],
        ];
    }
}
