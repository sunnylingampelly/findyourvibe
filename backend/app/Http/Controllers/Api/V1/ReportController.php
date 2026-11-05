<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UserReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reported_id' => ['required', 'exists:users,id', Rule::notIn([$request->user()->id])],
            'category' => ['required', Rule::in([
                'inappropriate_behaviour', 'fake_profile', 'harassment',
                'suspicious_activity', 'misleading_information', 'other'
            ])],
            'description' => ['required', 'string', 'max:2000'],
        ]);

        $report = UserReport::create([
            'reporter_id' => $request->user()->id,
            'reported_id' => $validated['reported_id'],
            'category' => $validated['category'],
            'description' => $validated['description'],
            'status' => 'open',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Report submitted. Our team will review it.',
            'data' => ['id' => $report->id],
        ], 201);
    }
}
