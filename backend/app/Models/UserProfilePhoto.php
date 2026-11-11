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

    // Return root-relative path so the browser resolves it against the page
    // origin — works through the Vite proxy in dev and nginx in production.
    public function getUrlAttribute(): ?string
    {
        if (!$this->path) {
            $raw = $this->attributes['url'] ?? null;
            if ($raw && str_starts_with($raw, 'http') && preg_match('/\/storage\/(.+)$/', $raw, $m)) {
                return '/storage/' . $m[1];
            }
            return $raw;
        }
        return '/storage/' . $this->path;
    }
}
