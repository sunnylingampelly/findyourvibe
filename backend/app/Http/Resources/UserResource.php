<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = $this->profile;

        $profileData = [
            'id' => $profile?->id,
            'user_id' => $this->id,
            'display_name' => $profile?->display_name ?? $this->name,
            'date_of_birth' => $profile?->date_of_birth,
            'gender' => $profile?->gender,
            'bio' => $profile?->bio,
            'introduction' => $profile?->introduction,
            'profile_photo_url' => $profile?->profile_photo_url,
            'is_companion' => (bool) $profile?->is_companion,
            'companion_verification_status' => $profile?->companion_verification_status ?? 'not_started',
            'avg_rating' => $profile?->avg_rating,
            'rating_count' => $profile?->rating_count ?? 0,
            'identity_verified' => (bool) $profile?->identity_verified_at,
            'selfie_pending' => $profile?->selfie_photo && !$profile?->identity_verified_at,
            'country' => $profile?->country ? ['id' => $profile->country->id, 'name' => $profile->country->name, 'code' => $profile->country->code, 'phone_code' => $profile->country->phone_code ?? ''] : null,
            'city' => $profile?->city ? ['id' => $profile->city->id, 'name' => $profile->city->name, 'country_id' => $profile->city->country_id] : null,
        ];

        return [
            'id' => $this->id,
            'name' => $this->name,
            // Flat copies for backwards compatibility
            'display_name' => $profileData['display_name'],
            'age' => $profile?->age,
            'gender' => $profileData['gender'],
            'bio' => $profileData['bio'],
            'introduction' => $profileData['introduction'],
            'profile_photo_url' => $profileData['profile_photo_url'],
            'is_companion' => $profileData['is_companion'],
            'companion_verification_status' => $profileData['companion_verification_status'],
            'avg_rating' => $profileData['avg_rating'],
            'rating_count' => $profileData['rating_count'],
            'identity_verified' => $profileData['identity_verified'],
            'location' => [
                'city' => $profile?->city ? ['id' => $profile->city->id, 'name' => $profile->city->name] : null,
                'country' => $profile?->country ? ['id' => $profile->country->id, 'name' => $profile->country->name, 'code' => $profile->country->code] : null,
            ],
            // Nested profile object matching the TypeScript UserProfile type
            'profile' => $profileData,
            'interests' => InterestResource::collection($this->whenLoaded('interests')),
            'languages' => LanguageResource::collection($this->whenLoaded('languages')),
            'services' => ServiceResource::collection($this->whenLoaded('services')),
            'last_active_at' => $this->last_active_at?->diffForHumans(),
            'account_status' => $this->account_status,
        ];
    }
}
