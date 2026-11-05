<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Swipe;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SwipeController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'swiped_id' => ['required', 'exists:users,id', Rule::notIn([$request->user()->id])],
            'direction' => ['required', Rule::in(['left', 'right'])],
        ]);

        $existing = Swipe::where('swiper_id', $request->user()->id)
            ->where('swiped_id', $validated['swiped_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You have already swiped on this profile.',
            ], 422);
        }

        $swipe = Swipe::create([
            'swiper_id' => $request->user()->id,
            'swiped_id' => $validated['swiped_id'],
            'direction' => $validated['direction'],
        ]);

        return response()->json([
            'success' => true,
            'message' => $validated['direction'] === 'right' ? 'Interested!' : 'Passed.',
            'data' => [
                'id' => $swipe->id,
                'direction' => $swipe->direction,
                'swiped_id' => $swipe->swiped_id,
            ],
        ], 201);
    }

    public function history(Request $request): JsonResponse
    {
        $swipes = $request->user()->swipesGiven()
            ->with(['swiped.profile'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $swipes,
        ]);
    }
}
