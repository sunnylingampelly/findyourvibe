<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function __construct(private AuditService $auditService) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ServiceResource::collection(Service::orderBy('sort_order')->get()),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $service = Service::findOrFail($id);
        $service->update(array_filter($validated, fn($v) => !is_null($v)));

        $this->auditService->logFromRequest($request, 'service_updated', 'Service', $service->id);

        return response()->json([
            'success' => true,
            'message' => 'Service updated.',
            'data' => new ServiceResource($service->fresh()),
        ]);
    }
}
