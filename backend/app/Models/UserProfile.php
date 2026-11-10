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
        // Already a full URL (stored by older upload code)
        if (str_starts_with($this->profile_photo, 'http')) {
            return $this->profile_photo;
        }
        return url('storage/' . $this->profile_photo);
    }
}
