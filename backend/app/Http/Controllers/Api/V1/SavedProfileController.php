<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\SavedProfile;
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

        $existing = SavedProfile::where('user_id', $request->user()->id)
            ->where('saved_user_id', $validated['saved_user_id'])
            ->first();

        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Profile already saved.'], 422);
        }

        $saved = SavedProfile::create([
            'user_id' => $request->user()->id,
            'saved_user_id' => $validated['saved_user_id'],
        ]);

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
