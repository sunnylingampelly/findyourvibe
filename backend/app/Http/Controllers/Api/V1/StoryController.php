<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CompanionStory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $stories = CompanionStory::with(['user.profile'])
            ->active()
            ->where('user_id', '!=', $request->user()->id)
            ->whereHas('user.profile', fn($q) => $q->where('companion_verification_status', 'approved'))
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'caption' => $s->caption,
                'media_url' => $s->media_url,
                'media_type' => $s->media_type,
                'bg_color' => $s->bg_color,
                'expires_at' => $s->expires_at,
                'created_at' => $s->created_at,
                'user' => [
                    'id' => $s->user->id,
                    'display_name' => $s->user->profile?->display_name ?? $s->user->name,
                    'profile_photo_url' => $s->user->profile?->profile_photo_url,
                ],
            ]);

        return response()->json(['success' => true, 'data' => $stories]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'caption' => 'nullable|string|max:200',
            'bg_color' => 'nullable|string|max:20',
        ]);

        // Delete existing story from this user (one active story at a time)
        CompanionStory::where('user_id', $request->user()->id)->delete();

        $story = CompanionStory::create([
            'user_id' => $request->user()->id,
            'caption' => $validated['caption'] ?? null,
            'bg_color' => $validated['bg_color'] ?? '#236B63',
            'media_type' => 'text',
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json(['success' => true, 'data' => $story], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        CompanionStory::where('user_id', $request->user()->id)->delete();
        return response()->json(['success' => true]);
    }
}
