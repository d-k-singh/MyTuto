<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
