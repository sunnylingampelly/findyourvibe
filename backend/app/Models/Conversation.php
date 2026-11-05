<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = ['connection_id'];

    public function connection(): BelongsTo
    {
        return $this->belongsTo(Connection::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    public function latestMessage(): HasMany
    {
        return $this->hasMany(Message::class)->latest()->limit(1);
    }

    public function getOtherParticipant(string $userId): ?User
    {
        $connection = $this->connection;
        if (!$connection) return null;

        return $connection->getOtherUser($userId);
    }
}
