<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class DiscoveryService
{
    public function getProfiles(User $currentUser, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $blockedIds = $currentUser->blockedUsers()->pluck('blocked_id')->toArray();
        $blockedByIds = DB::table('user_blocks')->where('blocked_id', $currentUser->id)->pluck('blocker_id')->toArray();
        $swipedIds = $currentUser->swipesGiven()->pluck('swiped_id')->toArray();

        $excludeIds = array_unique(array_merge($blockedIds, $blockedByIds, $swipedIds, [$currentUser->id]));

        $query = User::with(['profile.country', 'profile.city', 'interests', 'languages', 'services'])
            ->active()
            ->companion()
            ->whereNotIn('id', $excludeIds);

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(fn($q) =>
                $q->where('name', 'like', "%{$s}%")
                  ->orWhereHas('profile', fn($pq) =>
                      $pq->where('display_name', 'like', "%{$s}%")
                         ->orWhere('bio', 'like', "%{$s}%")
                  )
            );
        }

        if (!empty($filters['service'])) {
            $query->whereHas('services', fn($q) => $q->where('slug', $filters['service']));
        }

        if (!empty($filters['service_id'])) {
            $query->whereHas('services', fn($q) => $q->where('services.id', $filters['service_id']));
        }

        if (!empty($filters['city_id'])) {
            $query->whereHas('profile', fn($q) => $q->where('city_id', $filters['city_id']));
        }

        if (!empty($filters['country_id'])) {
            $query->whereHas('profile', fn($q) => $q->where('country_id', $filters['country_id']));
        }

        if (!empty($filters['interest_id'])) {
            $query->whereHas('interests', fn($q) => $q->where('interests.id', $filters['interest_id']));
        }

        if (!empty($filters['language_id'])) {
            $query->whereHas('languages', fn($q) => $q->where('languages.id', $filters['language_id']));
        }

        $query->orderByDesc('last_active_at');

        return $query->paginate($perPage);
    }
}
