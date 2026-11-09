<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'requester_id', 'companion_id', 'service_id',
        'proposed_date', 'proposed_time', 'status', 'notes',
        'agreed_rate', 'duration_hours', 'location_notes', 'companion_response_note',
    ];

    protected function casts(): array
    {
        return [
            'proposed_date' => 'date',
            'agreed_rate' => 'decimal:2',
        ];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function companion(): BelongsTo
    {
        return $this->belongsTo(User::class, 'companion_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
