<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\ProfileView;
use App\Models\User;
use App\Services\DiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
