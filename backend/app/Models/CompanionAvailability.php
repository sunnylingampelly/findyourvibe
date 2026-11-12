<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanionAvailability extends Model
{
    protected $table = 'companion_availability';

    protected $fillable = [
        'user_id', 'day_of_week', 'start_time', 'end_time', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'day_of_week' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isAvailableNow(): bool
    {
        if (!$this->is_active) return false;
        $now = now();
        $today = (int) $now->format('w'); // 0=Sunday
        if ($this->day_of_week !== $today) return false;
        $currentTime = $now->format('H:i:s');
        return $currentTime >= $this->start_time && $currentTime <= $this->end_time;
    }
}
