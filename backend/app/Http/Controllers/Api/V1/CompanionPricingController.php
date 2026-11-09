<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanionPricingController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCompanion()) {
            return response()->json(['success' => false, 'message' => 'Only approved companions can set pricing.'], 403);
        }

        $validated = $request->validate([
            'services'                       => ['required', 'array'],
            'services.*.service_id'          => ['required', 'integer', 'exists:services,id'],
            'services.*.price_per_session'   => ['nullable', 'numeric', 'min:0', 'max:99999'],
            'services.*.price_currency'      => ['nullable', 'string', 'size:3'],
            'services.*.price_unit'          => ['nullable', 'string', 'in:per_session,per_hour,negotiable'],
        ]);

        foreach ($validated['services'] as $item) {
            $user->services()->syncWithoutDetaching([$item['service_id'] => [
                'price_per_session' => $item['price_per_session'] ?? null,
                'price_currency'    => $item['price_currency'] ?? 'INR',
                'price_unit'        => $item['price_unit'] ?? 'per_session',
            ]]);
        }

        return response()->json(['success' => true, 'message' => 'Pricing updated.']);
    }
}
