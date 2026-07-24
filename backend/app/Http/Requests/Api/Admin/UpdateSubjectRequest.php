<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubjectRequest extends FormRequest
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
        $subject = $this->route('subject');
        $categoryId = $this->input('subject_category_id', $subject->subject_category_id);

        return [
            'subject_category_id' => ['sometimes', 'integer', 'exists:subject_categories,id'],
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('subjects')->where('subject_category_id', $categoryId)->ignore($subject),
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
