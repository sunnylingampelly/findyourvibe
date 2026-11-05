<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = $this->profile;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'display_name' => $profile?->display_name ?? $this->name,
            'age' => $profile?->age,
            'gender' => $profile?->gender,
            'bio' => $profile?->bio,
            'introduction' => $profile?->introduction,
            'profile_photo_url' => $profile?->profile_photo_url,
            'is_companion' => (bool) $profile?->is_companion,
            'companion_verification_status' => $profile?->companion_verification_status ?? 'not_started',
            'avg_rating' => $profile?->avg_rating,
            'rating_count' => $profile?->rating_count ?? 0,
            'location' => [
                'city' => $profile?->city ? ['id' => $profile->city->id, 'name' => $profile->city->name] : null,
                'country' => $profile?->country ? ['id' => $profile->country->id, 'name' => $profile->country->name, 'code' => $profile->country->code] : null,
            ],
            'interests' => InterestResource::collection($this->whenLoaded('interests')),
            'languages' => LanguageResource::collection($this->whenLoaded('languages')),
            'services' => ServiceResource::collection($this->whenLoaded('services')),
            'last_active_at' => $this->last_active_at?->diffForHumans(),
            'account_status' => $this->account_status,
        ];
    }
}
