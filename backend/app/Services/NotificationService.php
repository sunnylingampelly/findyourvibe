<?php

namespace App\Services;

use App\Events\NotificationCreated;
use App\Models\User;
use Illuminate\Support\Str;

class NotificationService
{
    public static function send(User $recipient, User $actor, string $type, string $message): void
    {
        $profile = $actor->profile;
        $photoPath = $profile?->profile_photo;

        $actorData = [
            'id' => $actor->id,
            'name' => $actor->name,
            'display_name' => $profile?->display_name ?? $actor->name,
            'photo_url' => $photoPath
                ? (str_starts_with($photoPath, 'http') ? $photoPath : url('storage/' . $photoPath))
                : null,
        ];

        $data = [
            'type' => $type,
            'actor' => $actorData,
            'message' => $message,
        ];

        $recipient->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => $type,
            'data' => $data,
            'read_at' => null,
        ]);

        $unreadCount = $recipient->unreadNotifications()->count();

        broadcast(new NotificationCreated($recipient->id, array_merge($data, [
            'unread_count' => $unreadCount,
        ])));
    }
}
