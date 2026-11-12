<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExperiencePackage extends Model
{
    use HasUlids;

    protected $fillable = [
        'companion_id', 'title', 'description', 'price', 'currency',
        'duration_hours', 'location_type', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'duration_hours' => 'decimal:1',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function companion(): BelongsTo
    {
        return $this->belongsTo(User::class, 'companion_id');
    }
}
