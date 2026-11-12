<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CompanionAvailability;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvailabilityController extends Controller
{
    public function mine(Request $request): JsonResponse
    {
        $slots = CompanionAvailability::where('user_id', $request->user()->id)
            ->orderBy('day_of_week')
            ->get();

        return response()->json(['success' => true, 'data' => $slots]);
    }

    public function forProfile(Request $request, string $userId): JsonResponse
    {
        $slots = CompanionAvailability::where('user_id', $userId)
            ->where('is_active', true)
            ->orderBy('day_of_week')
            ->get();

        $now = now();
        $todayDow = (int) $now->format('w');
        $currentTime = $now->format('H:i:s');

        $isAvailableNow = $slots->first(fn($s) =>
            $s->day_of_week === $todayDow
            && $currentTime >= $s->start_time
            && $currentTime <= $s->end_time
        ) !== null;

        $todaySlot = $slots->firstWhere('day_of_week', $todayDow);

        return response()->json([
            'success' => true,
            'data' => [
                'slots' => $slots,
                'is_available_now' => $isAvailableNow,
                'today_slot' => $todaySlot,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slots' => 'required|array',
            'slots.*.day_of_week' => 'required|integer|min:0|max:6',
            'slots.*.start_time' => 'required|date_format:H:i',
            'slots.*.end_time' => 'required|date_format:H:i|after:slots.*.start_time',
            'slots.*.is_active' => 'boolean',
        ]);

        $userId = $request->user()->id;

        foreach ($validated['slots'] as $slot) {
            CompanionAvailability::updateOrCreate(
                ['user_id' => $userId, 'day_of_week' => $slot['day_of_week']],
                [
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'is_active' => $slot['is_active'] ?? true,
                ]
            );
        }

        $slots = CompanionAvailability::where('user_id', $userId)->orderBy('day_of_week')->get();
        return response()->json(['success' => true, 'data' => $slots]);
    }
}
