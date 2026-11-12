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
        'prompt_1_q', 'prompt_1_a', 'prompt_2_q', 'prompt_2_a', 'prompt_3_q', 'prompt_3_a',
        'voice_intro', 'specialty_tags',
        'country_id', 'city_id', 'profile_photo', 'selfie_photo', 'identity_verified_at',
        'is_companion', 'companion_verification_status', 'avg_rating', 'rating_count',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth'       => 'date',
            'is_companion'        => 'boolean',
            'avg_rating'          => 'decimal:2',
            'identity_verified_at' => 'datetime',
            'specialty_tags'      => 'array',
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

    public function getVoiceIntroUrlAttribute(): ?string
    {
        if (!$this->voice_intro) {
            return null;
        }
        if (str_starts_with($this->voice_intro, 'http')) {
            return $this->voice_intro;
        }
        return '/storage/' . $this->voice_intro;
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        if (!$this->profile_photo) {
            return null;
        }
        $raw = $this->profile_photo;
        // Legacy records stored full URLs — extract the relative part.
        if (str_starts_with($raw, 'http')) {
            if (preg_match('/\/storage\/(.+)$/', $raw, $m)) {
                return '/storage/' . $m[1];
            }
            return $raw;
        }
        return '/storage/' . $raw;
    }
}
