<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ExperiencePackage;
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

        $query = Booking::with(['requester.profile', 'companion.profile', 'service', 'package'])
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
            'package_id'     => ['nullable', 'string', 'exists:experience_packages,id'],
            'proposed_date'  => ['required', 'date', 'after_or_equal:today'],
            'proposed_time'  => ['required', 'date_format:H:i'],
            'notes'          => ['nullable', 'string', 'max:1000'],
            'duration_hours' => ['nullable', 'string', 'max:20'],
            'location_notes' => ['nullable', 'string', 'max:500'],
            'agreed_rate'    => ['nullable', 'numeric', 'min:0'],
            'plus_one_name'  => ['nullable', 'string', 'max:100'],
            'plus_one_phone' => ['nullable', 'string', 'max:20'],
        ]);

        $companion = User::companion()->find($validated['companion_id']);
        if (!$companion) {
            return response()->json(['success' => false, 'message' => 'Companion not found or not approved.'], 422);
        }

        if ($companion->id === $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'You cannot book yourself.'], 422);
        }

        // Auto-fill price/duration from selected package
        if (!empty($validated['package_id'])) {
            $package = ExperiencePackage::find($validated['package_id']);
            if ($package && $package->companion_id === $validated['companion_id']) {
                if (empty($validated['agreed_rate'])) {
                    $validated['agreed_rate'] = $package->price;
                }
                if (empty($validated['duration_hours']) && $package->duration_hours) {
                    $validated['duration_hours'] = (string) $package->duration_hours;
                }
            }
        }

        $booking = Booking::create(array_merge($validated, [
            'requester_id' => $request->user()->id,
            'status' => 'pending',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Booking request sent!',
            'data' => $this->formatBooking($booking->load(['requester.profile', 'companion.profile', 'service', 'package'])),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);
        $userId = $request->user()->id;
        $currentStatus = $booking->status;

        // Rating submission for completed bookings (requester only)
        if ($currentStatus === 'completed' && $request->has('rating')) {
            if ($booking->requester_id !== $userId) {
                return response()->json(['success' => false, 'message' => 'Only the requester can submit a review.'], 403);
            }
            $validated = $request->validate([
                'rating'      => ['required', 'integer', 'min:1', 'max:5'],
                'review_text' => ['nullable', 'string', 'max:1000'],
            ]);
            $booking->update($validated);
            return response()->json([
                'success' => true,
                'data' => $this->formatBooking($booking->fresh(['requester.profile', 'companion.profile', 'service', 'package'])),
            ]);
        }

        // Block terminal states
        if (in_array($currentStatus, ['declined', 'cancelled', 'completed'])) {
            return response()->json(['success' => false, 'message' => 'This booking cannot be updated in its current state.'], 422);
        }

        // Allowed transitions per current status
        $allowed = $currentStatus === 'accepted'
            ? ['cancelled', 'completed']
            : ['accepted', 'declined', 'cancelled'];

        $validated = $request->validate([
            'status'                  => ['required', Rule::in($allowed)],
            'companion_response_note' => ['nullable', 'string', 'max:500'],
        ]);

        $newStatus = $validated['status'];

        // Authorization
        if ($newStatus === 'cancelled') {
            // Both requester and companion may cancel
            if (!in_array($userId, [$booking->requester_id, $booking->companion_id])) {
                return response()->json(['success' => false, 'message' => 'Not authorized to cancel this booking.'], 403);
            }
        } elseif (in_array($newStatus, ['accepted', 'declined'])) {
            if ($booking->companion_id !== $userId) {
                return response()->json(['success' => false, 'message' => 'Only the companion can accept or decline.'], 403);
            }
        } elseif ($newStatus === 'completed') {
            if (!in_array($userId, [$booking->requester_id, $booking->companion_id])) {
                return response()->json(['success' => false, 'message' => 'Not authorized.'], 403);
            }
            $validated['completed_at'] = now();
        }

        $booking->update($validated);

        return response()->json([
            'success' => true,
            'data' => $this->formatBooking($booking->fresh(['requester.profile', 'companion.profile', 'service', 'package'])),
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
            'rating' => $b->rating,
            'review_text' => $b->review_text,
            'completed_at' => $b->completed_at,
            'requester' => $profile($b->requester),
            'companion' => $profile($b->companion),
            'service' => $b->service ? ['id' => $b->service->id, 'name' => $b->service->name, 'slug' => $b->service->slug] : null,
            'package' => $b->package ? [
                'id' => $b->package->id,
                'title' => $b->package->title,
                'price' => (float) $b->package->price,
                'currency' => $b->package->currency,
                'duration_hours' => $b->package->duration_hours ? (float) $b->package->duration_hours : null,
            ] : null,
            'plus_one_name' => $b->plus_one_name,
            'plus_one_phone' => $b->plus_one_phone,
            'created_at' => $b->created_at,
        ];
    }
}
