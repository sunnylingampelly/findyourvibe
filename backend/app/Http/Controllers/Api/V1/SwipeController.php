<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Swipe;
use App\Models\User;
use App\Services\ConnectionService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SwipeController extends Controller
{
    public function __construct(private ConnectionService $connectionService) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'swiped_id' => ['required', 'exists:users,id', Rule::notIn([$request->user()->id])],
            'direction' => ['required', Rule::in(['left', 'right'])],
        ]);

        $swiper = $request->user();

        $existing = Swipe::where('swiper_id', $swiper->id)
            ->where('swiped_id', $validated['swiped_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You have already swiped on this profile.',
            ], 422);
        }

        $swipe = Swipe::create([
            'swiper_id' => $swiper->id,
            'swiped_id' => $validated['swiped_id'],
            'direction' => $validated['direction'],
        ]);

        $matched = false;
        $conversationId = null;
        $matchedProfile = null;

        if ($validated['direction'] === 'right') {
            $swiped = User::with('profile')->find($validated['swiped_id']);

            if ($swiped) {
                try {
                    $swiperName = $swiper->profile?->display_name ?? $swiper->name;
                    NotificationService::send($swiped, $swiper, 'profile_vibe', "{$swiperName} vibed with you! 💚");
                } catch (\Throwable) {}

                $mutualVibe = Swipe::where('swiper_id', $swiped->id)
                    ->where('swiped_id', $swiper->id)
                    ->where('direction', 'right')
                    ->exists();

                if ($mutualVibe) {
                    $matched = true;
                    $result = $this->connectionService->findOrCreateDirectConnection($swiper, $swiped);
                    $conversationId = $result['conversation']->id;

                    try {
                        $swipedName = $swiped->profile?->display_name ?? $swiped->name;
                        $swiperName = $swiper->profile?->display_name ?? $swiper->name;
                        NotificationService::send($swiper, $swiped, 'mutual_vibe', "It's a match with {$swipedName}! 🎉 Say hello →");
                        NotificationService::send($swiped, $swiper, 'mutual_vibe', "It's a match with {$swiperName}! 🎉 Say hello →");
                    } catch (\Throwable) {}

                    $photo = $swiped->profile?->profile_photo;
                    $matchedProfile = [
                        'display_name' => $swiped->profile?->display_name ?? $swiped->name,
                        'profile_photo_url' => $photo
                            ? (str_starts_with($photo, 'http') ? $photo : '/storage/' . $photo)
                            : null,
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => $validated['direction'] === 'right' ? 'Interested!' : 'Passed.',
            'data' => [
                'id' => $swipe->id,
                'direction' => $swipe->direction,
                'swiped_id' => $swipe->swiped_id,
                'matched' => $matched,
                'conversation_id' => $conversationId,
                'matched_profile' => $matchedProfile,
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
