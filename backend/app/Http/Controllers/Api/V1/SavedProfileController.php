<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\SavedProfile;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SavedProfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $saved = $request->user()->savedProfiles()
            ->with(['savedUser.profile.country', 'savedUser.profile.city', 'savedUser.interests', 'savedUser.languages', 'savedUser.services'])
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $saved->map(fn($s) => [
                'id' => $s->id,
                'user' => new UserResource($s->savedUser),
                'saved_at' => $s->created_at,
            ]),
            'meta' => [
                'current_page' => $saved->currentPage(),
                'last_page' => $saved->lastPage(),
                'total' => $saved->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'saved_user_id' => ['required', 'exists:users,id', Rule::notIn([$request->user()->id])],
        ]);

        $saved = SavedProfile::firstOrCreate([
            'user_id' => $request->user()->id,
            'saved_user_id' => $validated['saved_user_id'],
        ]);

        if ($saved->wasRecentlyCreated) {
            try {
                $savedUser = User::find($validated['saved_user_id']);
                if ($savedUser) {
                    $saverName = $request->user()->profile?->display_name ?? $request->user()->name;
                    NotificationService::send($savedUser, $request->user(), 'profile_saved', "{$saverName} saved your profile");
                }
            } catch (\Throwable) {}
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile saved.',
            'data' => ['id' => $saved->id],
        ], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $saved = SavedProfile::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $saved->delete();

        return response()->json(['success' => true, 'message' => 'Profile removed from saved.']);
    }
}
