<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConnectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $userId = $request->user()->id;
        $otherUser = $this->getOtherUser($userId);

        return [
            'id' => $this->id,
            'other_user' => $otherUser ? new UserResource($otherUser->load(['profile.country', 'profile.city', 'interests', 'languages', 'services'])) : null,
            'connected_at' => $this->connected_at,
            'conversation_id' => $this->conversation?->id,
        ];
    }
}
