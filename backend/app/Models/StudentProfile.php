<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Appends(['completion_percentage', 'is_minor', 'display_name'])]
#[Fillable([
    'user_id',
    'parent_user_id',
    'full_name',
    'date_of_birth',
    'gender',
    'country',
    'city',
    'profile_photo_path',
    'learning_goal',
    'school_name',
    'parental_consent_given',
    'is_active',
])]
class StudentProfile extends Model
{
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'parental_consent_given' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_user_id');
    }

    /**
     * Percentage of the core onboarding fields that have been filled in.
     */
    protected function completionPercentage(): Attribute
    {
        $fields = ['date_of_birth', 'gender', 'country', 'city', 'profile_photo_path', 'learning_goal', 'school_name'];

        return Attribute::make(
            get: fn () => (int) round(
                (count(array_filter($fields, fn (string $field) => filled($this->{$field}))) / count($fields)) * 100
            ),
        )->shouldCache();
    }

    /**
     * Whether this profile has no login of its own — created directly by a
     * parent (spec 4.2), rather than via a student's own registration.
     */
    public function isChildProfile(): bool
    {
        return $this->user_id === null;
    }

    /**
     * full_name is set directly for parent-created child profiles; for a
     * self-registered student it falls back to the linked user's name.
     */
    protected function displayName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->full_name ?? $this->user?->name,
        );
    }

    /**
     * Whether this student is under 18 — drives the mandatory parental
     * consent flow (spec 3.1). Null date_of_birth is treated as unknown,
     * not as an adult, so consuming code doesn't accidentally skip consent.
     */
    protected function isMinor(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->date_of_birth === null ? null : $this->date_of_birth->age < 18,
        )->shouldCache();
    }
}
