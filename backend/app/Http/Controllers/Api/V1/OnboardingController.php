<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserPrivateResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OnboardingController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['profile.country', 'profile.city', 'preferences', 'interests', 'languages', 'services']);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserPrivateResource($user),
                'is_completed' => !is_null($user->onboarding_completed_at),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $step = (int) $request->input('step', 1);
        $complete = (bool) $request->input('complete', false);
        $user = $request->user();

        match ($step) {
            1 => $this->updateStep1($request, $user),
            2 => $this->updateStep2($request, $user),
            3 => $this->updateStep3($request, $user),
            4 => $this->updateStep4($request, $user),
            5 => $this->updateStep5($request, $user),
            6 => $this->updateStep6($request, $user),
            default => null,
        };

        if ($complete || $step === 6) {
            $user->update(['onboarding_completed_at' => now()]);
        }


        $user = $user->fresh()->load(['profile.country', 'profile.city', 'preferences', 'interests', 'languages', 'services']);

        return response()->json([
            'success' => true,
            'message' => $complete ? 'Onboarding complete.' : "Step {$step} saved.",
            'data' => new UserPrivateResource($user),
        ]);
    }

    // Step 1: Basic Info — display_name, date_of_birth, gender
    private function updateStep1(Request $request, $user): void
    {
        $validated = $request->validate([
            'display_name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date', 'before:-18 years'],
            'gender' => ['required', Rule::in(['male', 'female', 'non_binary', 'prefer_not_to_say'])],
        ]);

        $user->profile()->updateOrCreate(['user_id' => $user->id], [
            'display_name' => $validated['display_name'],
            'date_of_birth' => $validated['date_of_birth'],
            'gender' => $validated['gender'],
        ]);

        // Also update user's name if not set
        if (!$user->name || $user->name === $user->email) {
            $user->update(['name' => $validated['display_name']]);
        }
    }

    // Step 2: About — bio, introduction
    private function updateStep2(Request $request, $user): void
    {
        $validated = $request->validate([
            'bio' => ['nullable', 'string', 'max:1000'],
            'introduction' => ['nullable', 'string', 'max:500'],
        ]);

        $user->profile()->updateOrCreate(['user_id' => $user->id], $validated);
    }

    // Step 3: Interests
    private function updateStep3(Request $request, $user): void
    {
        $validated = $request->validate([
            'interest_ids' => ['nullable', 'array'],
            'interest_ids.*' => ['exists:interests,id'],
        ]);

        $user->interests()->sync($validated['interest_ids'] ?? []);
    }

    // Step 4: Languages
    private function updateStep4(Request $request, $user): void
    {
        $validated = $request->validate([
            'language_ids' => ['nullable', 'array'],
            'language_ids.*' => ['exists:languages,id'],
        ]);

        $user->languages()->sync($validated['language_ids'] ?? []);
    }

    // Step 5: Services/Experience preferences
    private function updateStep5(Request $request, $user): void
    {
        $validated = $request->validate([
            'service_ids' => ['nullable', 'array'],
            'service_ids.*' => ['exists:services,id'],
        ]);

        $user->services()->sync($validated['service_ids'] ?? []);
    }

    // Step 6: Review & Complete — save any remaining fields
    private function updateStep6(Request $request, $user): void
    {
        // Save all fields in one shot (tolerant — no required fields here)
        $profileData = array_filter([
            'display_name' => $request->input('display_name'),
            'date_of_birth' => $request->input('date_of_birth'),
            'gender' => $request->input('gender'),
            'bio' => $request->input('bio'),
            'introduction' => $request->input('introduction'),
            'country_id' => $request->input('country_id') ?: null,
            'city_id' => $request->input('city_id') ?: null,
        ], fn($v) => !is_null($v));

        if (!empty($profileData)) {
            $user->profile()->updateOrCreate(['user_id' => $user->id], $profileData);
        }

        if ($request->has('interest_ids')) {
            $user->interests()->sync((array) $request->input('interest_ids'));
        }
        if ($request->has('language_ids')) {
            $user->languages()->sync((array) $request->input('language_ids'));
        }
        if ($request->has('service_ids')) {
            $user->services()->sync((array) $request->input('service_ids'));
        }
    }
}
