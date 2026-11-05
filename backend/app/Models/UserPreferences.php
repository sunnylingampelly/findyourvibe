<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreferences extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'preferred_min_age', 'preferred_max_age',
        'preferred_discovery_radius_km', 'preferred_languages',
        'discovery_enabled', 'show_online_status',
    ];

    protected function casts(): array
    {
        return [
            'preferred_languages' => 'array',
            'discovery_enabled' => 'boolean',
            'show_online_status' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
