<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
