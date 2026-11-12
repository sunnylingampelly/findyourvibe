<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\SafeMeet;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SafeMeetController extends Controller
{
    public function show(Request $request, string $bookingId): JsonResponse
    {
        $booking = Booking::findOrFail($bookingId);
        $user = $request->user();

        if (!in_array($user->id, [$booking->requester_id, $booking->companion_id])) {
            return response()->json(['success' => false, 'message' => 'Not authorized.'], 403);
        }

        $safeMeet = SafeMeet::where('booking_id', $bookingId)->where('user_id', $user->id)->first();

        return response()->json([
            'success' => true,
            'data' => $safeMeet ? $this->format($safeMeet) : null,
        ]);
    }

    public function store(Request $request, string $bookingId): JsonResponse
    {
        $booking = Booking::findOrFail($bookingId);
        $user = $request->user();

        if (!in_array($user->id, [$booking->requester_id, $booking->companion_id])) {
            return response()->json(['success' => false, 'message' => 'Not authorized.'], 403);
        }

        if ($booking->status !== 'accepted') {
            return response()->json(['success' => false, 'message' => 'Safe Meet can only be set up for accepted bookings.'], 422);
        }

        $validated = $request->validate([
            'trusted_name'  => ['required', 'string', 'max:100'],
            'trusted_phone' => ['required', 'string', 'max:20'],
        ]);

        $safeMeet = SafeMeet::updateOrCreate(
            ['booking_id' => $bookingId, 'user_id' => $user->id],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Safe Meet set up. Your trusted contact will be alerted if you trigger SOS.',
            'data' => $this->format($safeMeet),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $safeMeet = SafeMeet::findOrFail($id);
        $user = $request->user();

        if ($safeMeet->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Not authorized.'], 403);
        }

        $validated = $request->validate([
            'action' => ['required', 'in:checkin,checkout,sos'],
        ]);

        $updates = match ($validated['action']) {
            'checkin'  => ['checkin_at' => now(), 'checkout_at' => null],
            'checkout' => ['checkout_at' => now()],
            'sos'      => ['sos_triggered_at' => now()],
        };

        $safeMeet->update($updates);

        if ($validated['action'] === 'sos') {
            try {
                $booking = $safeMeet->booking()->with(['requester.profile', 'companion.profile'])->first();
                $other = $booking?->requester_id === $user->id ? $booking?->companion : $booking?->requester;
                if ($other) {
                    $name = $user->profile?->display_name ?? $user->name;
                    NotificationService::send($other, $user, 'sos_triggered', "⚠️ SOS triggered by {$name}. Please check in with them immediately.");
                }
            } catch (\Throwable) {}
        }

        return response()->json([
            'success' => true,
            'message' => match ($validated['action']) {
                'checkin'  => 'Checked in. Stay safe! 🛡️',
                'checkout' => 'Checked out. Hope you had a great time! 🎉',
                'sos'      => '🚨 SOS triggered. The other person has been alerted.',
            },
            'data' => $this->format($safeMeet->fresh()),
        ]);
    }

    private function format(SafeMeet $sm): array
    {
        return [
            'id'               => $sm->id,
            'booking_id'       => $sm->booking_id,
            'trusted_name'     => $sm->trusted_name,
            'trusted_phone'    => $sm->trusted_phone,
            'checkin_at'       => $sm->checkin_at?->toIso8601String(),
            'checkout_at'      => $sm->checkout_at?->toIso8601String(),
            'sos_triggered_at' => $sm->sos_triggered_at?->toIso8601String(),
            'status'           => $this->computeStatus($sm),
        ];
    }

    private function computeStatus(SafeMeet $sm): string
    {
        if ($sm->sos_triggered_at) return 'sos';
        if ($sm->checkout_at)      return 'completed';
        if ($sm->checkin_at)       return 'active';
        return 'setup';
    }
}
