<?php

namespace App\Models;

use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'subject_category_id',
    'name',
    'slug',
    'description',
    'grade_levels',
    'exam_boards',
    'countries',
    'is_active',
])]
class Subject extends Model
{
    use HasUniqueSlug;

    protected function casts(): array
    {
        return [
            'grade_levels' => 'array',
            'exam_boards' => 'array',
            'countries' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(SubjectCategory::class, 'subject_category_id');
    }
}
