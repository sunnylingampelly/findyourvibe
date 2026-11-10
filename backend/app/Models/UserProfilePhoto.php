<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfilePhoto extends Model
{
    protected $fillable = ['user_id', 'path', 'url', 'sort_order', 'is_primary'];

    protected $casts = ['is_primary' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Always regenerate from path so legacy full-URL records (with old ports)
    // are served correctly via the current APP_URL.
    public function getUrlAttribute(): ?string
    {
        if (!$this->path) {
            return $this->attributes['url'] ?? null;
        }
        return url('storage/' . $this->path);
    }
}
