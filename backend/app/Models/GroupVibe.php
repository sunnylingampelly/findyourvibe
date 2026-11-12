<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GroupVibe extends Model
{
    use HasUlids;

    protected $fillable = [
        'host_id', 'title', 'description', 'activity',
        'location', 'scheduled_at', 'max_members', 'is_active',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'is_active'    => 'boolean',
        'max_members'  => 'integer',
    ];

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(GroupVibeMember::class);
    }

    public function acceptedMembers(): HasMany
    {
        return $this->hasMany(GroupVibeMember::class)->where('status', 'accepted');
    }
}
