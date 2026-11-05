<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanionApplicationResource;
use App\Services\CompanionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CompanionController extends Controller
{
    public function __construct(private CompanionService $companionService) {}

    public function show(Request $request): JsonResponse
    {
        $application = $request->user()->companionApplication()->with(['documents'])->first();

        if (!$application) {
            return response()->json(['success' => true, 'data' => null]);
        }

        return response()->json([
            'success' => true,
            'data' => new CompanionApplicationResource($application),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $existing = $request->user()->companionApplication;
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Application already exists.'], 422);
        }

        $validated = $request->validate([
            'legal_name' => ['required', 'string', 'max:255'],
            'submission_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $application = $request->user()->companionApplication()->create(array_merge($validated, ['status' => 'draft']));

        return response()->json([
            'success' => true,
            'message' => 'Application started.',
            'data' => new CompanionApplicationResource($application),
        ], 201);
    }

    public function update(Request $request): JsonResponse
    {
        $application = $request->user()->companionApplication;
        if (!$application) {
            return response()->json(['success' => false, 'message' => 'No application found.'], 404);
        }

        $validated = $request->validate([
            'legal_name' => ['sometimes', 'string', 'max:255'],
            'submission_notes' => ['nullable', 'string', 'max:2000'],
            'submit' => ['nullable', 'boolean'],
        ]);

        $data = array_filter(array_intersect_key($validated, array_flip(['legal_name', 'submission_notes'])));

        if (!empty($validated['submit']) && $validated['submit']) {
            $data['status'] = 'submitted';
            $request->user()->profile()->update(['companion_verification_status' => 'submitted']);
        }

        $application->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Application updated.',
            'data' => new CompanionApplicationResource($application->fresh(['documents'])),
        ]);
    }

    public function uploadDocument(Request $request): JsonResponse
    {
        $application = $request->user()->companionApplication;
        if (!$application) {
            return response()->json(['success' => false, 'message' => 'No application found.'], 404);
        }

        $request->validate([
            'document' => ['required', 'file', 'mimes:jpeg,jpg,png,pdf', 'max:10240'],
            'document_type' => ['required', Rule::in(['identity', 'selfie', 'other'])],
        ]);

        $path = $request->file('document')->store('companion-documents/' . $application->id, 'private');

        $doc = $application->documents()->create([
            'document_type' => $request->document_type,
            'file_path' => $path,
            'original_name' => $request->file('document')->getClientOriginalName(),
            'mime_type' => $request->file('document')->getMimeType(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded.',
            'data' => ['id' => $doc->id, 'document_type' => $doc->document_type],
        ], 201);
    }
}
