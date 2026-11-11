<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $userId = $request->user()->id;
        $otherUser = $this->getOtherParticipant($userId);
        $latestMessage = $this->latestMessage;
        $unreadCount = $this->messages()->where('sender_id', '!=', $userId)->whereNull('read_at')->count();

        return [
            'id' => $this->id,
            'other_user' => $otherUser ? new UserResource($otherUser->load(['profile.country', 'profile.city'])) : null,
            'last_message' => $latestMessage ? new MessageResource($latestMessage) : null,
            'unread_count' => $unreadCount,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
