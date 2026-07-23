<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Appends(['completion_percentage'])]
#[Fillable([
    'user_id',
    'display_name',
    'bio',
    'date_of_birth',
    'gender',
    'country',
    'city',
    'profile_photo_path',
    'teaching_mode',
    'years_experience',
    'identity_verified',
    'education_verified',
    'background_check_passed',
    'is_approved',
])]
class TeacherProfile extends Model
{
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'identity_verified' => 'boolean',
            'education_verified' => 'boolean',
            'background_check_passed' => 'boolean',
            'is_approved' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Percentage of the core onboarding fields that have been filled in.
     * Used to prompt teachers to complete their profile (spec 2.2).
     */
    protected function completionPercentage(): Attribute
    {
        $fields = [
            'display_name',
            'bio',
            'date_of_birth',
            'gender',
            'country',
            'city',
            'profile_photo_path',
            'teaching_mode',
            'years_experience',
        ];

        return Attribute::make(
            get: fn () => (int) round(
                (count(array_filter($fields, fn (string $field) => filled($this->{$field}))) / count($fields)) * 100
            ),
        )->shouldCache();
    }
}
