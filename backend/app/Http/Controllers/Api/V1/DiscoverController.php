<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\ProfileView;
use App\Models\User;
use App\Services\DiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiscoverController extends Controller
{
    public function __construct(private DiscoveryService $discoveryService) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['service_id', 'service', 'search', 'city_id', 'country_id', 'interest_id', 'language_id']);
        $profiles = $this->discoveryService->getProfiles($request->user(), $filters, 20);

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($profiles),
            'meta' => [
                'current_page' => $profiles->currentPage(),
                'last_page' => $profiles->lastPage(),
                'per_page' => $profiles->perPage(),
                'total' => $profiles->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $user = User::with(['profile.country', 'profile.city', 'interests', 'languages', 'services'])->findOrFail($id);

        $blockedByViewer = $request->user()->blockedUsers()->where('blocked_id', $id)->exists();
        $viewerBlockedBy = $user->blockedUsers()->where('blocked_id', $request->user()->id)->exists();

        if ($blockedByViewer || $viewerBlockedBy) {
            return response()->json(['success' => false, 'message' => 'Profile not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new UserResource($user),
        ]);
    }

    public function trending(Request $request): JsonResponse
    {
        $blockedIds = $request->user()->blockedUsers()->pluck('blocked_id')->toArray();
        $blockedByIds = \Illuminate\Support\Facades\DB::table('user_blocks')
            ->where('blocked_id', $request->user()->id)
            ->pluck('blocker_id')
            ->toArray();
        $excludeIds = array_unique(array_merge($blockedIds, $blockedByIds, [$request->user()->id]));

        $profiles = User::with(['profile.country', 'profile.city', 'interests', 'languages', 'services'])
            ->active()
            ->whereNotIn('id', $excludeIds)
            ->whereHas('profile', fn($q) => $q->where('companion_verification_status', 'approved'))
            ->whereHas('profile', fn($q) => $q->where('avg_rating', '>=', 4)->where('rating_count', '>=', 1))
            ->orderByRaw('(SELECT avg_rating FROM user_profiles WHERE user_profiles.user_id = users.id) DESC')
            ->orderByRaw('(SELECT rating_count FROM user_profiles WHERE user_profiles.user_id = users.id) DESC')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($profiles),
        ]);
    }

    public function recordView(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $viewer = $request->user();

        if ($viewer->id !== $user->id) {
            ProfileView::create([
                'viewer_id' => $viewer->id,
                'viewed_id' => $user->id,
                'viewed_at' => now(),
            ]);
        }

        return response()->json(['success' => true, 'message' => 'View recorded.']);
    }
}
