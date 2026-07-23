<?php

namespace App\Models;

use App\Enums\ConsentRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['student_id', 'parent_email', 'status', 'expires_at', 'responded_at'])]
class ParentalConsentRequest extends Model
{
    protected function casts(): array
    {
        return [
            'status' => ConsentRequestStatus::class,
            'expires_at' => 'datetime',
            'responded_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function isPending(): bool
    {
        return $this->status === ConsentRequestStatus::Pending;
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isActionable(): bool
    {
        return $this->isPending() && ! $this->isExpired();
    }
}
