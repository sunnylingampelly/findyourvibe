<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AdminAuditLog::with(['admin']);

        if ($action = $request->input('action')) {
            $query->where('action', 'like', "%{$action}%");
        }

        if ($adminId = $request->input('admin_id')) {
            $query->where('admin_id', $adminId);
        }

        $logs = $query->latest()->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $logs->map(fn($l) => [
                'id' => $l->id,
                'admin' => $l->admin?->name ?? 'System',
                'action' => $l->action,
                'entity_type' => $l->entity_type,
                'entity_id' => $l->entity_id,
                'ip_address' => $l->ip_address,
                'timestamp' => $l->created_at,
            ]),
            'meta' => ['current_page' => $logs->currentPage(), 'last_page' => $logs->lastPage(), 'total' => $logs->total()],
        ]);
    }
}
