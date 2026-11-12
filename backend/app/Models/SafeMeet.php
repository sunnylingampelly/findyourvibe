<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SafeMeet extends Model
{
    use HasUlids;

    protected $fillable = [
        'booking_id', 'user_id', 'trusted_name', 'trusted_phone',
        'checkin_at', 'checkout_at', 'sos_triggered_at',
    ];

    protected function casts(): array
    {
        return [
            'checkin_at'       => 'datetime',
            'checkout_at'      => 'datetime',
            'sos_triggered_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo { return $this->belongsTo(Booking::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
