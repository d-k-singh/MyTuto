<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'teacher_profile_id',
    'subject_id',
    'grade_levels',
    'price_per_session_cp',
])]
class TeacherSubject extends Model
{
    protected function casts(): array
    {
        return [
            'grade_levels' => 'array',
            'price_per_session_cp' => 'integer',
        ];
    }

    public function teacherProfile(): BelongsTo
    {
        return $this->belongsTo(TeacherProfile::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
