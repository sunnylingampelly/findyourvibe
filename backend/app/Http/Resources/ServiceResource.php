<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $hasPivot = isset($this->pivot);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'color' => $this->color,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'price_per_session' => $hasPivot ? $this->pivot->price_per_session : null,
            'price_currency' => $hasPivot ? ($this->pivot->price_currency ?? 'INR') : null,
            'price_unit' => $hasPivot ? ($this->pivot->price_unit ?? 'per_session') : null,
        ];
    }
}
