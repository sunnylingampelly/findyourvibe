<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'display_name', 'date_of_birth', 'gender', 'bio', 'introduction',
        'country_id', 'city_id', 'profile_photo', 'is_companion',
        'companion_verification_status', 'avg_rating', 'rating_count',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'is_companion' => 'boolean',
            'avg_rating' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function getAgeAttribute(): ?int
    {
        return $this->date_of_birth?->age;
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        if (!$this->profile_photo) {
            return null;
        }
        // Extract the storage-relative path and regenerate with current APP_URL.
        // Handles legacy records that stored full URLs (possibly with a different
        // port or host, e.g. http://localhost:8001/storage/profile-photos/xxx.gif).
        $raw = $this->profile_photo;
        if (str_starts_with($raw, 'http')) {
            // Pull out everything after "/storage/"
            if (preg_match('/\/storage\/(.+)$/', $raw, $m)) {
                return url('storage/' . $m[1]);
            }
            return $raw; // unknown format — return as-is
        }
        return url('storage/' . $raw);
    }
}
