<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ExperiencePackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExperiencePackageController extends Controller
{
    public function index(string $companionId): JsonResponse
    {
        $packages = ExperiencePackage::where('companion_id', $companionId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['success' => true, 'data' => $packages->map(fn($p) => $this->format($p))]);
    }

    public function mine(Request $request): JsonResponse
    {
        $packages = ExperiencePackage::where('companion_id', $request->user()->id)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['success' => true, 'data' => $packages->map(fn($p) => $this->format($p))]);
    }

    public function store(Request $request): JsonResponse
    {
        $count = ExperiencePackage::where('companion_id', $request->user()->id)->count();
        if ($count >= 5) {
            return response()->json(['success' => false, 'message' => 'Maximum 5 experience packages allowed.'], 422);
        }

        $validated = $request->validate([
            'title'          => ['required', 'string', 'max:100'],
            'description'    => ['nullable', 'string', 'max:500'],
            'price'          => ['required', 'numeric', 'min:0'],
            'currency'       => ['nullable', 'string', 'size:3'],
            'duration_hours' => ['nullable', 'numeric', 'min:0.5', 'max:24'],
            'location_type'  => ['nullable', 'string', 'max:50'],
            'is_active'      => ['nullable', 'boolean'],
            'sort_order'     => ['nullable', 'integer', 'min:0'],
        ]);

        $pkg = ExperiencePackage::create(array_merge($validated, [
            'companion_id' => $request->user()->id,
            'currency' => $validated['currency'] ?? 'INR',
        ]));

        return response()->json(['success' => true, 'data' => $this->format($pkg)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $pkg = ExperiencePackage::where('companion_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'title'          => ['sometimes', 'string', 'max:100'],
            'description'    => ['nullable', 'string', 'max:500'],
            'price'          => ['sometimes', 'numeric', 'min:0'],
            'currency'       => ['nullable', 'string', 'size:3'],
            'duration_hours' => ['nullable', 'numeric', 'min:0.5', 'max:24'],
            'location_type'  => ['nullable', 'string', 'max:50'],
            'is_active'      => ['nullable', 'boolean'],
            'sort_order'     => ['nullable', 'integer', 'min:0'],
        ]);

        $pkg->update($validated);

        return response()->json(['success' => true, 'data' => $this->format($pkg)]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        ExperiencePackage::where('companion_id', $request->user()->id)->findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Package deleted.']);
    }

    private function format(ExperiencePackage $p): array
    {
        return [
            'id'             => $p->id,
            'title'          => $p->title,
            'description'    => $p->description,
            'price'          => (float) $p->price,
            'currency'       => $p->currency,
            'duration_hours' => $p->duration_hours ? (float) $p->duration_hours : null,
            'location_type'  => $p->location_type,
            'is_active'      => $p->is_active,
            'sort_order'     => $p->sort_order,
        ];
    }
}
