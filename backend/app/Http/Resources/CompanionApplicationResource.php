<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanionApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user()?->isAdmin();

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->user)),
            'legal_name' => $this->legal_name,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'submission_notes' => $this->submission_notes,
            'admin_notes' => $this->when($isAdmin, $this->admin_notes),
            'rejection_reason' => $this->rejection_reason,
            'reviewed_at' => $this->reviewed_at,
            'reviewer' => $this->when($isAdmin && $this->reviewed_by, fn() => $this->reviewer?->name),
            'documents' => ($this->documents ?? collect())->map(fn($d) => [
                'id' => $d->id,
                'document_type' => $d->document_type,
                'original_name' => $d->original_name,
                'mime_type' => $d->mime_type,
                'created_at' => $d->created_at,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
