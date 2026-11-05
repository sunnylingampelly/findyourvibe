<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\CompanionApplication;
use App\Models\Connection;
use App\Models\ConnectionRequest;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\UserReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $stats = [
            'users' => [
                'total' => User::where('role', 'user')->count(),
                'active' => User::where('role', 'user')->where('account_status', 'active')->count(),
                'suspended' => User::where('role', 'user')->where('account_status', 'suspended')->count(),
                'new_this_week' => User::where('role', 'user')->where('created_at', '>=', now()->subWeek())->count(),
            ],
            'companions' => [
                'total_applications' => CompanionApplication::count(),
                'pending' => CompanionApplication::whereIn('status', ['submitted', 'under_review'])->count(),
                'approved' => CompanionApplication::where('status', 'approved')->count(),
                'rejected' => CompanionApplication::where('status', 'rejected')->count(),
                'total_verified' => UserProfile::where('is_companion', true)->where('companion_verification_status', 'approved')->count(),
            ],
            'connections' => [
                'total' => Connection::count(),
                'pending_requests' => ConnectionRequest::where('status', 'pending')->count(),
            ],
            'reports' => [
                'total' => UserReport::count(),
                'open' => UserReport::where('status', 'open')->count(),
                'under_review' => UserReport::where('status', 'under_review')->count(),
            ],
        ];

        $recentUsers = User::where('role', 'user')
            ->with(['profile'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'status' => $u->account_status,
                'joined' => $u->created_at->diffForHumans(),
            ]);

        $pendingApplications = CompanionApplication::whereIn('status', ['submitted', 'under_review'])
            ->with(['user'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'user_name' => $a->user->name,
                'legal_name' => $a->legal_name,
                'status' => $a->status,
                'submitted' => $a->updated_at->diffForHumans(),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'recent_users' => $recentUsers,
                'pending_applications' => $pendingApplications,
            ],
        ]);
    }
}
