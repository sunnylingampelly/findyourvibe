<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserPrivateResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['profile.country', 'profile.city', 'preferences', 'interests', 'languages', 'services', 'profilePhotos']);
        $user->update(['last_active_at' => now()]);

        return response()->json([
            'success' => true,
            'data' => new UserPrivateResource($user),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'display_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:-18 years'],
            'gender' => ['sometimes', 'nullable', Rule::in(['male', 'female', 'non_binary', 'prefer_not_to_say'])],
            'bio' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'introduction' => ['sometimes', 'nullable', 'string', 'max:500'],
            'country_id' => ['sometimes', 'nullable', 'exists:countries,id'],
            'city_id' => ['sometimes', 'nullable', 'exists:cities,id'],
            'interest_ids' => ['sometimes', 'array'],
            'interest_ids.*' => ['exists:interests,id'],
            'language_ids' => ['sometimes', 'array'],
            'language_ids.*' => ['exists:languages,id'],
            'service_ids' => ['sometimes', 'array'],
            'service_ids.*' => ['exists:services,id'],
        ]);

        $user = $request->user();

        if (isset($validated['name'])) {
            $user->update(['name' => $validated['name']]);
        }

        $profileData = array_intersect_key($validated, array_flip([
            'display_name', 'date_of_birth', 'gender', 'bio', 'introduction', 'country_id', 'city_id'
        ]));

        if (!empty($profileData)) {
            $user->profile()->updateOrCreate(['user_id' => $user->id], $profileData);
        }

        if (isset($validated['interest_ids'])) {
            $user->interests()->sync($validated['interest_ids']);
        }

        if (isset($validated['language_ids'])) {
            $user->languages()->sync($validated['language_ids']);
        }

        if (isset($validated['service_ids'])) {
            $user->services()->sync($validated['service_ids']);
        }

        $user = $user->fresh()->load(['profile.country', 'profile.city', 'preferences', 'interests', 'languages', 'services']);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => new UserPrivateResource($user),
        ]);
    }

    public function updatePhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $user = $request->user();

        if ($user->profile?->profile_photo) {
            Storage::disk('public')->delete($user->profile->profile_photo);
        }

        $path = $request->file('photo')->store('profiles', 'public');
        $user->profile()->updateOrCreate(['user_id' => $user->id], ['profile_photo' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Profile photo updated.',
            'data' => ['profile_photo_url' => url('storage/' . $path)],
        ]);
    }
}
