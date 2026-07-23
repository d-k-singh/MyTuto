<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Appends(['completion_percentage'])]
#[Fillable([
    'user_id',
    'relationship_to_child',
    'country',
    'city',
    'credit_spend_limit',
])]
class ParentProfile extends Model
{
    protected function casts(): array
    {
        return [
            'credit_spend_limit' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function children(): HasMany
    {
        return $this->hasMany(StudentProfile::class, 'parent_user_id', 'user_id');
    }

    /**
     * Percentage of the core onboarding fields that have been filled in.
     * credit_spend_limit is intentionally excluded — null legitimately
     * means "no limit set", not "incomplete".
     */
    protected function completionPercentage(): Attribute
    {
        $fields = ['relationship_to_child', 'country', 'city'];

        return Attribute::make(
            get: fn () => (int) round(
                (count(array_filter($fields, fn (string $field) => filled($this->{$field}))) / count($fields)) * 100
            ),
        )->shouldCache();
    }
}
