<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class UserPrivateResource extends UserResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'email' => $this->email,
            'mobile' => $this->mobile,
            'country_code' => $this->country_code,
            'role' => $this->role,
            'email_verified_at' => $this->email_verified_at,
            'onboarding_completed_at' => $this->onboarding_completed_at,
            'photos' => $this->whenLoaded('profilePhotos', fn() => $this->profilePhotos->map(fn($p) => [
                'id' => $p->id,
                'url' => $p->url,
                'is_primary' => $p->is_primary,
                'sort_order' => $p->sort_order,
            ])->values()),
            'preferences' => $this->whenLoaded('preferences', fn() => [
                'preferred_min_age' => $this->preferences?->preferred_min_age,
                'preferred_max_age' => $this->preferences?->preferred_max_age,
                'preferred_discovery_radius_km' => $this->preferences?->preferred_discovery_radius_km,
                'preferred_languages' => $this->preferences?->preferred_languages,
                'discovery_enabled' => $this->preferences?->discovery_enabled,
                'show_online_status' => $this->preferences?->show_online_status,
            ]),
        ]);
    }
}
