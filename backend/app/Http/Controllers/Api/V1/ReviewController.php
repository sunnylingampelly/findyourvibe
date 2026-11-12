<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function store(Request $request, string $bookingId): JsonResponse
    {
        $booking = Booking::findOrFail($bookingId);
        $user = $request->user();

        if ($booking->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'Reviews can only be submitted for completed bookings.'], 422);
        }

        $isRequester = $booking->requester_id === $user->id;
        $isCompanion = $booking->companion_id === $user->id;

        if (!$isRequester && !$isCompanion) {
            return response()->json(['success' => false, 'message' => 'You are not part of this booking.'], 403);
        }

        $existing = Review::where('booking_id', $bookingId)->where('reviewer_id', $user->id)->first();
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'You have already submitted a review for this booking.'], 422);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body'   => ['nullable', 'string', 'max:1000'],
        ]);

        $revieweeId   = $isRequester ? $booking->companion_id : $booking->requester_id;
        $reviewerRole = $isRequester ? 'requester' : 'companion';

        $review = Review::create([
            'booking_id'    => $bookingId,
            'reviewer_id'   => $user->id,
            'reviewee_id'   => $revieweeId,
            'rating'        => $validated['rating'],
            'body'          => $validated['body'] ?? null,
            'reviewer_role' => $reviewerRole,
            'is_published'  => false,
        ]);

        $otherReview = Review::where('booking_id', $bookingId)
            ->where('reviewer_id', $revieweeId)
            ->first();

        if ($otherReview) {
            DB::transaction(function () use ($review, $otherReview) {
                $review->update(['is_published' => true]);
                $otherReview->update(['is_published' => true]);
                $this->recalcRating($review->reviewee_id);
                $this->recalcRating($otherReview->reviewee_id);
            });

            try {
                $reviewee = User::find($revieweeId);
                if ($reviewee) {
                    $name = $user->profile?->display_name ?? $user->name;
                    NotificationService::send($reviewee, $user, 'review_published', "Your review from {$name} is now live! ⭐");
                }
            } catch (\Throwable) {}
        }

        return response()->json([
            'success' => true,
            'message' => $otherReview
                ? 'Review published! Both reviews are now live.'
                : 'Review submitted. Waiting for the other party to submit theirs.',
            'data' => [
                'review_id'      => $review->id,
                'both_published' => (bool) $otherReview,
            ],
        ], 201);
    }

    public function forProfile(Request $request, string $userId): JsonResponse
    {
        $reviews = Review::where('reviewee_id', $userId)
            ->where('is_published', true)
            ->with('reviewer.profile')
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $reviews->map(fn($r) => [
                'id'            => $r->id,
                'rating'        => $r->rating,
                'body'          => $r->body,
                'reviewer_role' => $r->reviewer_role,
                'reviewer_name' => $r->reviewer?->profile?->display_name ?? 'Anonymous',
                'created_at'    => $r->created_at?->toDateString(),
            ]),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page'    => $reviews->lastPage(),
                'total'        => $reviews->total(),
            ],
        ]);
    }

    public function myReviewForBooking(Request $request, string $bookingId): JsonResponse
    {
        $review = Review::where('booking_id', $bookingId)
            ->where('reviewer_id', $request->user()->id)
            ->first();

        return response()->json([
            'success' => true,
            'data' => $review ? [
                'submitted'    => true,
                'is_published' => $review->is_published,
                'rating'       => $review->rating,
                'body'         => $review->body,
            ] : ['submitted' => false, 'is_published' => false],
        ]);
    }

    private function recalcRating(string $userId): void
    {
        $stats = Review::where('reviewee_id', $userId)
            ->where('is_published', true)
            ->selectRaw('AVG(rating) as avg, COUNT(*) as cnt')
            ->first();

        UserProfile::where('user_id', $userId)->update([
            'avg_rating'   => round($stats->avg ?? 0, 2),
            'rating_count' => $stats->cnt ?? 0,
        ]);
    }
}
