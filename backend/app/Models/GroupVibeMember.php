<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupVibeMember extends Model
{
    protected $fillable = ['group_vibe_id', 'user_id', 'status', 'joined_at'];

    protected $casts = [
        'joined_at' => 'datetime',
    ];

    public function groupVibe(): BelongsTo
    {
        return $this->belongsTo(GroupVibe::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
