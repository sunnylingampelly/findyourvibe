<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function __construct(private AuditService $auditService) {}

    public function index(): JsonResponse
    {
        $settings = PlatformSetting::all()->groupBy('group');

        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable'],
        ]);

        foreach ($validated['settings'] as $setting) {
            PlatformSetting::where('key', $setting['key'])->update(['value' => $setting['value']]);
        }

        $this->auditService->logFromRequest($request, 'settings_updated', null, null, ['keys' => array_column($validated['settings'], 'key')]);

        return response()->json(['success' => true, 'message' => 'Settings updated.']);
    }
}
