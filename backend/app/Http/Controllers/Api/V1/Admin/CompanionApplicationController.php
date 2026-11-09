<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanionApplicationResource;
use App\Models\CompanionApplication;
use App\Services\AuditService;
use App\Services\CompanionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanionApplicationController extends Controller
{
    public function __construct(
        private CompanionService $companionService,
        private AuditService $auditService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = CompanionApplication::with(['user.profile', 'documents']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(fn($q) =>
                $q->where('legal_name', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($uq) => $uq->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%"))
            );
        }

        $applications = $query->latest()->paginate(25);

        return response()->json([
            'success' => true,
            'data' => CompanionApplicationResource::collection($applications),
            'meta' => [
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
                'total' => $applications->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $application = CompanionApplication::with(['user.profile', 'documents', 'reviewer'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new CompanionApplicationResource($application),
        ]);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $application = CompanionApplication::findOrFail($id);

        if (!in_array($application->status, ['submitted', 'under_review', 'additional_info_required'])) {
            return response()->json(['success' => false, 'message' => 'Application cannot be approved in its current state.'], 422);
        }

        $application = $this->companionService->approve($application, $request->user());

        if ($request->filled('admin_notes')) {
            $application->update(['admin_notes' => $request->admin_notes]);
            $application = $application->fresh();
        }

        $this->auditService->logFromRequest($request, 'companion_approved', 'CompanionApplication', $application->id);

        return response()->json([
            'success' => true,
            'message' => 'Companion application approved.',
            'data' => new CompanionApplicationResource($application),
        ]);
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $request->validate(['reason' => ['required', 'string', 'max:1000']]);

        $application = CompanionApplication::findOrFail($id);

        if (!in_array($application->status, ['submitted', 'under_review', 'additional_info_required'])) {
            return response()->json(['success' => false, 'message' => 'Application cannot be rejected in its current state.'], 422);
        }

        $application = $this->companionService->reject($application, $request->user(), $request->reason);

        $this->auditService->logFromRequest($request, 'companion_rejected', 'CompanionApplication', $application->id, [
            'reason' => $request->reason
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Companion application rejected.',
            'data' => new CompanionApplicationResource($application),
        ]);
    }

    public function requestInformation(Request $request, string $id): JsonResponse
    {
        $request->validate(['notes' => ['required', 'string', 'max:2000']]);

        $application = CompanionApplication::findOrFail($id);
        $application = $this->companionService->requestInformation($application, $request->user(), $request->notes);

        $this->auditService->logFromRequest($request, 'companion_info_requested', 'CompanionApplication', $application->id);

        return response()->json([
            'success' => true,
            'message' => 'Additional information requested.',
            'data' => new CompanionApplicationResource($application),
        ]);
    }

    public function downloadDocument(Request $request, string $id, string $docId): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\JsonResponse
    {
        $application = CompanionApplication::findOrFail($id);
        $doc = $application->documents()->findOrFail($docId);

        if (!Storage::disk('local')->exists($doc->file_path)) {
            return response()->json(['success' => false, 'message' => 'File not found.'], 404);
        }

        return Storage::disk('local')->download(
            $doc->file_path,
            $doc->original_name,
            ['Content-Type' => $doc->mime_type ?? 'application/octet-stream']
        );
    }
}
