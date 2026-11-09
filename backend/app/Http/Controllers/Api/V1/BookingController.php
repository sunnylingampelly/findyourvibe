<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $role = $request->query('role', 'requester');

        $query = Booking::with(['requester.profile', 'companion.profile', 'service'])
            ->orderBy('proposed_date', 'desc');

        if ($role === 'companion') {
            $query->where('companion_id', $userId);
        } else {
            $query->where('requester_id', $userId);
        }

        $bookings = $query->get();

        return response()->json([
            'success' => true,
            'data' => $bookings->map(fn($b) => $this->formatBooking($b)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'companion_id'   => ['required', 'string', 'exists:users,id'],
            'service_id'     => ['required', 'integer', 'exists:services,id'],
            'proposed_date'  => ['required', 'date', 'after_or_equal:today'],
            'proposed_time'  => ['required', 'date_format:H:i'],
            'notes'          => ['nullable', 'string', 'max:1000'],
            'duration_hours' => ['nullable', 'string', 'max:20'],
            'location_notes' => ['nullable', 'string', 'max:500'],
            'agreed_rate'    => ['nullable', 'numeric', 'min:0'],
        ]);

        $companion = User::companion()->find($validated['companion_id']);
        if (!$companion) {
            return response()->json(['success' => false, 'message' => 'Companion not found or not approved.'], 422);
        }

        if ($companion->id === $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'You cannot book yourself.'], 422);
        }

        $booking = Booking::create(array_merge($validated, [
            'requester_id' => $request->user()->id,
            'status' => 'pending',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Booking request sent!',
            'data' => $this->formatBooking($booking->load(['requester.profile', 'companion.profile', 'service'])),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);
        $userId = $request->user()->id;

        if (in_array($booking->status, ['accepted', 'declined', 'cancelled', 'completed'])) {
            return response()->json(['success' => false, 'message' => 'This booking cannot be updated in its current state.'], 422);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['accepted', 'declined', 'cancelled'])],
            'companion_response_note' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validated['status'] === 'cancelled' && $booking->requester_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Only the requester can cancel.'], 403);
        }

        if (in_array($validated['status'], ['accepted', 'declined']) && $booking->companion_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Only the companion can accept or decline.'], 403);
        }

        $booking->update($validated);

        return response()->json([
            'success' => true,
            'data' => $this->formatBooking($booking->fresh(['requester.profile', 'companion.profile', 'service'])),
        ]);
    }

    private function formatBooking(Booking $b): array
    {
        $profile = fn($user) => $user ? [
            'id' => $user->id,
            'display_name' => $user->profile?->display_name ?? $user->name,
            'profile_photo_url' => $user->profile?->profile_photo_url,
        ] : null;

        return [
            'id' => $b->id,
            'status' => $b->status,
            'proposed_date' => $b->proposed_date?->format('Y-m-d'),
            'proposed_time' => $b->proposed_time ? substr($b->proposed_time, 0, 5) : null,
            'duration_hours' => $b->duration_hours,
            'notes' => $b->notes,
            'location_notes' => $b->location_notes,
            'agreed_rate' => $b->agreed_rate,
            'companion_response_note' => $b->companion_response_note,
            'requester' => $profile($b->requester),
            'companion' => $profile($b->companion),
            'service' => $b->service ? ['id' => $b->service->id, 'name' => $b->service->name, 'slug' => $b->service->slug] : null,
            'created_at' => $b->created_at,
        ];
    }
}
