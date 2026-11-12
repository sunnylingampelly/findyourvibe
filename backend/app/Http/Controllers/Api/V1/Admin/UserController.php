<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct(private AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'user')
            ->with(['profile.country', 'profile.city'])
            ->withCount(['connectionRequestsSent', 'swipesGiven']);

        if ($search = $request->input('search')) {
            $query->where(fn($q) =>
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
            );
        }

        if ($status = $request->input('status')) {
            $query->where('account_status', $status);
        }

        if ($companion = $request->input('is_companion')) {
            $query->whereHas('profile', fn($q) => $q->where('is_companion', filter_var($companion, FILTER_VALIDATE_BOOLEAN)));
        }

        $users = $query->latest()->paginate(25);

        return response()->json([
            'success' => true,
            'data' => $users->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'status' => $u->account_status,
                'is_companion' => $u->profile?->is_companion,
                'companion_status' => $u->profile?->companion_verification_status,
                'city' => $u->profile?->city?->name,
                'country' => $u->profile?->country?->name,
                'joined' => $u->created_at->toDateString(),
                'onboarding_completed' => !is_null($u->onboarding_completed_at),
                'last_active' => $u->last_active_at?->diffForHumans(),
            ]),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $user = User::with(['profile.country', 'profile.city', 'interests', 'languages', 'services', 'companionApplication'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'role' => $user->role,
                'status' => $user->account_status,
                'email_verified_at' => $user->email_verified_at,
                'onboarding_completed_at' => $user->onboarding_completed_at,
                'last_active_at' => $user->last_active_at,
                'profile' => $user->profile,
                'interests' => $user->interests->pluck('name'),
                'languages' => $user->languages->pluck('name'),
                'services' => $user->services->pluck('name'),
                'companion_application' => $user->companionApplication ? [
                    'id' => $user->companionApplication->id,
                    'status' => $user->companionApplication->status,
                    'submitted_at' => $user->companionApplication->created_at,
                ] : null,
                'joined' => $user->created_at,
            ],
        ]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'suspended'])],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $user = User::where('role', 'user')->findOrFail($id);
        $previousStatus = $user->account_status;
        $user->update(['account_status' => $validated['status']]);

        $action = $validated['status'] === 'suspended' ? 'user_suspended' : 'user_reinstated';
        $this->auditService->logFromRequest($request, $action, 'User', $user->id, [
            'previous_status' => $previousStatus,
            'reason' => $validated['reason'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "User account {$validated['status']}.",
        ]);
    }

    public function verifyIdentity(Request $request, string $id): JsonResponse
    {
        $user = User::with('profile')->findOrFail($id);

        if (!$user->profile?->selfie_photo) {
            return response()->json(['success' => false, 'message' => 'User has not submitted a selfie.'], 422);
        }

        $user->profile->update(['identity_verified_at' => now()]);

        $this->auditService->logFromRequest($request, 'identity_verified', 'User', $user->id, []);

        return response()->json(['success' => true, 'message' => 'Identity verified.']);
    }
}
