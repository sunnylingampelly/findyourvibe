<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UserProfilePhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfilePhotosController extends Controller
{
    private const MAX_PHOTOS = 5;

    public function index(Request $request): JsonResponse
    {
        $photos = $request->user()->profilePhotos()->get();
        return response()->json(['success' => true, 'data' => $photos]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate(['photo' => ['required', 'image', 'max:5120']]);

        if ($user->profilePhotos()->count() >= self::MAX_PHOTOS) {
            return response()->json(['success' => false, 'message' => 'Maximum 5 photos allowed.'], 422);
        }

        $path = $request->file('photo')->store('profile-photos', 'public');
        $url = Storage::disk('public')->url($path);

        $isPrimary = $user->profilePhotos()->count() === 0;
        $sortOrder = $user->profilePhotos()->max('sort_order') + 1;

        $photo = $user->profilePhotos()->create([
            'path' => $path,
            'url' => $url,
            'sort_order' => $sortOrder,
            'is_primary' => $isPrimary,
        ]);

        // Set as main profile photo if this is the first
        if ($isPrimary) {
            $user->profile()->updateOrCreate(['user_id' => $user->id], ['profile_photo' => $url]);
        }

        return response()->json(['success' => true, 'data' => $photo], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $photo = $user->profilePhotos()->findOrFail($id);

        Storage::disk('public')->delete($photo->path);
        $wasPrimary = $photo->is_primary;
        $photo->delete();

        // If deleted photo was primary, promote next one
        if ($wasPrimary) {
            $next = $user->profilePhotos()->first();
            if ($next) {
                $next->update(['is_primary' => true]);
                $user->profile()->update(['profile_photo' => $next->url]);
            } else {
                $user->profile()->update(['profile_photo' => null]);
            }
        }

        return response()->json(['success' => true]);
    }

    public function setPrimary(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $photo = $user->profilePhotos()->findOrFail($id);

        $user->profilePhotos()->update(['is_primary' => false]);
        $photo->update(['is_primary' => true]);
        $user->profile()->update(['profile_photo' => $photo->url]);

        return response()->json(['success' => true, 'data' => $photo]);
    }
}
