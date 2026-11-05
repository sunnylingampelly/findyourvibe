<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\UserBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BlockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $blocks = $request->user()->blockedUsers()
            ->with(['blocked.profile.country', 'blocked.profile.city'])
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $blocks->map(fn($b) => [
                'id' => $b->id,
                'user' => new UserResource($b->blocked),
                'blocked_at' => $b->created_at,
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'blocked_id' => ['required', 'exists:users,id', Rule::notIn([$request->user()->id])],
        ]);

        $existing = UserBlock::where('blocker_id', $request->user()->id)
            ->where('blocked_id', $validated['blocked_id'])
            ->first();

        if ($existing) {
            return response()->json(['success' => false, 'message' => 'User already blocked.'], 422);
        }

        $block = UserBlock::create([
            'blocker_id' => $request->user()->id,
            'blocked_id' => $validated['blocked_id'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User blocked.',
            'data' => ['id' => $block->id],
        ], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $block = UserBlock::where('blocker_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $block->delete();

        return response()->json(['success' => true, 'message' => 'User unblocked.']);
    }
}
