<?php

namespace App\Http\Requests\Api\Parent;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateChildProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Ownership (this child belongs to the requesting parent) is
        // checked in the controller, consistently with show/deactivate/
        // reactivate which don't go through a FormRequest at all.
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
            'full_name' => ['sometimes', 'string', 'max:255'],
            'date_of_birth' => ['sometimes', 'date', 'before:today', 'after:-25 years'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:50'],
            'school_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'learning_goal' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
