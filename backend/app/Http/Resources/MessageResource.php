<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id' => $this->sender_id,
            'sender' => $this->when($this->relationLoaded('sender'), fn() => new UserResource($this->sender)),
            'deleted' => (bool) $this->deleted_at,
            'body' => $this->deleted_at ? null : $this->body,
            'type' => $this->type,
            'read_at' => $this->read_at,
            'is_mine' => $request->user()?->id === $this->sender_id,
            'created_at' => $this->created_at,
            'attachments' => $this->whenLoaded('attachments', fn() =>
                $this->attachments->map(fn($a) => [
                    'id' => $a->id,
                    'url' => '/storage/' . $a->file_path,
                    'original_name' => $a->original_name,
                    'mime_type' => $a->mime_type,
                ])
            ),
        ];
    }
}
