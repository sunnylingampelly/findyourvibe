<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserReport;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public function __construct(private AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $query = UserReport::with(['reporter', 'reported']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        $reports = $query->latest()->paginate(25);

        return response()->json([
            'success' => true,
            'data' => $reports->map(fn($r) => [
                'id' => $r->id,
                'reporter' => ['id' => $r->reporter->id, 'name' => $r->reporter->name],
                'reported' => ['id' => $r->reported->id, 'name' => $r->reported->name],
                'category' => $r->category,
                'status' => $r->status,
                'description_preview' => substr($r->description, 0, 100),
                'submitted' => $r->created_at->diffForHumans(),
            ]),
            'meta' => ['current_page' => $reports->currentPage(), 'last_page' => $reports->lastPage(), 'total' => $reports->total()],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $report = UserReport::with(['reporter.profile', 'reported.profile', 'resolvedBy'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $report->id,
                'reporter' => ['id' => $report->reporter->id, 'name' => $report->reporter->name, 'email' => $report->reporter->email],
                'reported' => ['id' => $report->reported->id, 'name' => $report->reported->name, 'email' => $report->reported->email],
                'category' => $report->category,
                'description' => $report->description,
                'status' => $report->status,
                'admin_notes' => $report->admin_notes,
                'resolved_by' => $report->resolvedBy?->name,
                'resolved_at' => $report->resolved_at,
                'submitted' => $report->created_at,
            ],
        ]);
    }

    public function resolve(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'resolution' => ['required', Rule::in(['resolved', 'dismissed'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $report = UserReport::findOrFail($id);
        $report->update([
            'status' => $request->resolution,
            'admin_notes' => $request->notes,
            'resolved_by' => $request->user()->id,
            'resolved_at' => now(),
        ]);

        $this->auditService->logFromRequest($request, 'report_' . $request->resolution, 'UserReport', $report->id);

        return response()->json(['success' => true, 'message' => 'Report ' . $request->resolution . '.']);
    }
}
