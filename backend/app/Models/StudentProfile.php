<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'parent_user_id',
    'date_of_birth',
    'gender',
    'country',
    'city',
    'profile_photo_path',
    'learning_goal',
    'parental_consent_given',
])]
class StudentProfile extends Model
{
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'parental_consent_given' => 'boolean',
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
}
