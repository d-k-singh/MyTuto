<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
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
            'subject_category_id' => ['required', 'integer', 'exists:subject_categories,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('subjects')->where('subject_category_id', $this->input('subject_category_id')),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'grade_levels' => ['sometimes', 'nullable', 'array'],
            'grade_levels.*' => ['string', 'max:100'],
            'exam_boards' => ['sometimes', 'nullable', 'array'],
            'exam_boards.*' => ['string', 'max:100'],
            'countries' => ['sometimes', 'nullable', 'array'],
            'countries.*' => ['string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
