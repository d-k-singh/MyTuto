<?php

namespace App\Http\Requests\Api\Student;

use App\Enums\ConsentRequestStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreParentalConsentRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Route-level `role:student` middleware already restricts this to
        // students; the request always belongs to the current user.
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
            'parent_email' => ['required', 'email', 'max:255', 'different:current_email'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validationData(): array
    {
        // Lets the `different:current_email` rule above compare against
        // the authenticated user's own email without it being a real
        // input field the client has to send.
        return array_merge(parent::validationData(), [
            'current_email' => $this->user()->email,
        ]);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $profile = $this->user()->studentProfile;

            if ($profile->parent_user_id !== null) {
                $validator->errors()->add('parent_email', 'This account is already linked to a parent.');

                return;
            }

            $hasPendingRequest = $this->user()
                ->parentalConsentRequests()
                ->where('status', ConsentRequestStatus::Pending)
                ->where('expires_at', '>', now())
                ->exists();

            if ($hasPendingRequest) {
                $validator->errors()->add(
                    'parent_email',
                    'A consent request is already pending. Wait for it to be resolved or expire before sending another.'
                );
            }
        });
    }
}
