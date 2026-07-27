<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTeacherEnquiryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Route-level `role:student,parent` middleware already restricts
        // this to students/parents; the enquiry always belongs to the
        // current user.
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'subject_id' => ['sometimes', 'nullable', 'integer', 'exists:subjects,id'],
            'message' => ['required', 'string', 'max:1000'],
        ];
    }
}
