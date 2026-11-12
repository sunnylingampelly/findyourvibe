<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\BlockController;
use App\Http\Controllers\Api\V1\BookingController;
use App\Http\Controllers\Api\V1\CompanionPricingController;
use App\Http\Controllers\Api\V1\ProfilePhotosController;
use App\Http\Controllers\Api\V1\CompanionController;
use App\Http\Controllers\Api\V1\ConnectionController;
use App\Http\Controllers\Api\V1\ConnectionRequestController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\DiscoverController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OnboardingController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ExperiencePackageController;
use App\Http\Controllers\Api\V1\GroupVibeController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\SafeMeetController;
use App\Http\Controllers\Api\V1\SavedProfileController;
use App\Http\Controllers\Api\V1\SwipeController;
use App\Http\Controllers\Api\V1\Admin;
use App\Http\Resources\CityResource;
use App\Http\Resources\CountryResource;
use App\Http\Resources\InterestResource;
use App\Http\Resources\LanguageResource;
use App\Http\Resources\ServiceResource;
use App\Models\City;
use App\Models\Country;
use App\Models\Interest;
use App\Models\Language;
use App\Models\Service;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Public auth
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
        Route::post('verify-email', [AuthController::class, 'verifyEmail']);
    });

    // Broadcasting auth (Reverb / Echo)
    Route::post('broadcasting/auth', function (\Illuminate\Http\Request $request) {
        return \Illuminate\Support\Facades\Broadcast::auth($request);
    })->middleware('auth:sanctum');

    // Protected user routes
    Route::middleware(['auth:sanctum', 'active.user'])->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);

        // Profile & onboarding
        Route::get('me', [ProfileController::class, 'show']);
        Route::put('me/profile', [ProfileController::class, 'update']);
        Route::post('me/profile-photo', [ProfileController::class, 'updatePhoto']);
        Route::get('me/photos', [ProfilePhotosController::class, 'index']);
        Route::post('me/photos', [ProfilePhotosController::class, 'store']);
        Route::delete('me/photos/{id}', [ProfilePhotosController::class, 'destroy']);
        Route::post('me/photos/{id}/primary', [ProfilePhotosController::class, 'setPrimary']);
        Route::get('me/onboarding', [OnboardingController::class, 'show']);
        Route::put('me/onboarding', [OnboardingController::class, 'update']);

        // Reference data
        Route::get('interests', fn() => response()->json(['success' => true, 'data' => InterestResource::collection(Interest::where('is_active', true)->get())]));
        Route::get('languages', fn() => response()->json(['success' => true, 'data' => LanguageResource::collection(Language::where('is_active', true)->get())]));
        Route::get('services', fn() => response()->json(['success' => true, 'data' => ServiceResource::collection(Service::where('is_active', true)->orderBy('sort_order')->get())]));
        Route::get('countries', fn() => response()->json(['success' => true, 'data' => CountryResource::collection(Country::where('is_active', true)->get())]));
        Route::get('countries/{id}/cities', fn($id) => response()->json(['success' => true, 'data' => CityResource::collection(City::where('country_id', $id)->where('is_active', true)->get())]));

        // Discovery
        Route::get('discover', [DiscoverController::class, 'index']);
        Route::get('profiles/{id}', [DiscoverController::class, 'show']);
        Route::post('profiles/{id}/view', [DiscoverController::class, 'recordView']);

        // Swipes
        Route::post('swipes', [SwipeController::class, 'store']);
        Route::get('swipes/history', [SwipeController::class, 'history']);
        Route::get('swipes/received', [SwipeController::class, 'received']);

        // Saved profiles
        Route::get('saved-profiles', [SavedProfileController::class, 'index']);
        Route::post('saved-profiles', [SavedProfileController::class, 'store']);
        Route::delete('saved-profiles/{id}', [SavedProfileController::class, 'destroy']);

        // Connections
        Route::post('connections/requests', [ConnectionRequestController::class, 'store']);
        Route::get('connections/requests/received', [ConnectionRequestController::class, 'received']);
        Route::get('connections/requests/sent', [ConnectionRequestController::class, 'sent']);
        Route::post('connections/requests/{id}/accept', [ConnectionRequestController::class, 'accept']);
        Route::post('connections/requests/{id}/decline', [ConnectionRequestController::class, 'decline']);
        Route::post('connections/requests/{id}/withdraw', [ConnectionRequestController::class, 'withdraw']);
        Route::get('connections', [ConnectionController::class, 'index']);

        // Messaging
        Route::get('conversations', [ConversationController::class, 'index']);
        Route::post('conversations', [ConversationController::class, 'store']);
        Route::delete('conversations/{id}/messages', [ConversationController::class, 'clearMessages']);
        Route::get('conversations/{id}/messages', [MessageController::class, 'index']);
        Route::post('conversations/{id}/messages', [MessageController::class, 'store']);
        Route::delete('conversations/{conversationId}/messages/{messageId}', [MessageController::class, 'destroy']);
        Route::post('messages/{id}/read', [MessageController::class, 'markRead']);

        // Companion
        Route::get('companion/applications/me', [CompanionController::class, 'show']);
        Route::post('companion/applications', [CompanionController::class, 'store']);
        Route::put('companion/applications/me', [CompanionController::class, 'update']);
        Route::post('companion/applications/me/documents', [CompanionController::class, 'uploadDocument']);
        Route::put('companion/pricing', [CompanionPricingController::class, 'update']);

        // Bookings
        Route::get('bookings', [BookingController::class, 'index']);
        Route::post('bookings', [BookingController::class, 'store']);
        Route::patch('bookings/{id}', [BookingController::class, 'update']);

        // Reviews (double-blind)
        Route::post('bookings/{id}/reviews', [ReviewController::class, 'store']);
        Route::get('bookings/{id}/reviews/mine', [ReviewController::class, 'myReviewForBooking']);
        Route::get('profiles/{id}/reviews', [ReviewController::class, 'forProfile']);

        // Safe Meet
        Route::get('bookings/{id}/safe-meet', [SafeMeetController::class, 'show']);
        Route::post('bookings/{id}/safe-meet', [SafeMeetController::class, 'store']);
        Route::patch('safe-meets/{id}', [SafeMeetController::class, 'update']);

        // Selfie verification
        Route::post('me/selfie', [ProfileController::class, 'uploadSelfie']);

        // Voice intro
        Route::post('me/voice-intro', [ProfileController::class, 'uploadVoiceIntro']);
        Route::delete('me/voice-intro', [ProfileController::class, 'deleteVoiceIntro']);

        // Experience packages
        Route::get('companions/{id}/packages', [ExperiencePackageController::class, 'index']);
        Route::get('me/packages', [ExperiencePackageController::class, 'mine']);
        Route::post('me/packages', [ExperiencePackageController::class, 'store']);
        Route::put('me/packages/{id}', [ExperiencePackageController::class, 'update']);
        Route::delete('me/packages/{id}', [ExperiencePackageController::class, 'destroy']);

        // Group Vibes
        Route::get('group-vibes', [GroupVibeController::class, 'index']);
        Route::get('group-vibes/mine', [GroupVibeController::class, 'mine']);
        Route::post('group-vibes', [GroupVibeController::class, 'store']);
        Route::put('group-vibes/{id}', [GroupVibeController::class, 'update']);
        Route::post('group-vibes/{id}/join', [GroupVibeController::class, 'join']);
        Route::delete('group-vibes/{id}/leave', [GroupVibeController::class, 'leave']);
        Route::post('group-vibes/{id}/invite', [GroupVibeController::class, 'invite']);

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markRead']);

        // Safety
        Route::post('reports', [ReportController::class, 'store']);
        Route::post('blocks', [BlockController::class, 'store']);
        Route::delete('blocks/{id}', [BlockController::class, 'destroy']);
        Route::get('blocks', [BlockController::class, 'index']);
    });

    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::post('auth/login', [Admin\AuthController::class, 'login']);

        Route::middleware(['auth:sanctum', 'admin'])->group(function () {
            Route::post('auth/logout', [Admin\AuthController::class, 'logout']);
            Route::get('dashboard', [Admin\DashboardController::class, 'index']);

            Route::get('users', [Admin\UserController::class, 'index']);
            Route::get('users/{id}', [Admin\UserController::class, 'show']);
            Route::patch('users/{id}/status', [Admin\UserController::class, 'updateStatus']);

            Route::get('companion-applications', [Admin\CompanionApplicationController::class, 'index']);
            Route::get('companion-applications/{id}', [Admin\CompanionApplicationController::class, 'show']);
            Route::post('companion-applications/{id}/approve', [Admin\CompanionApplicationController::class, 'approve']);
            Route::post('companion-applications/{id}/reject', [Admin\CompanionApplicationController::class, 'reject']);
            Route::post('companion-applications/{id}/request-information', [Admin\CompanionApplicationController::class, 'requestInformation']);
            Route::get('companion-applications/{id}/documents/{docId}/download', [Admin\CompanionApplicationController::class, 'downloadDocument']);

            Route::get('reports', [Admin\ReportController::class, 'index']);
            Route::get('reports/{id}', [Admin\ReportController::class, 'show']);
            Route::post('reports/{id}/resolve', [Admin\ReportController::class, 'resolve']);

            Route::post('users/{id}/verify-identity', [Admin\UserController::class, 'verifyIdentity']);

            Route::get('audit-logs', [Admin\AuditLogController::class, 'index']);

            Route::get('services', [Admin\ServiceController::class, 'index']);
            Route::put('services/{id}', [Admin\ServiceController::class, 'update']);

            Route::get('settings', [Admin\SettingController::class, 'index']);
            Route::put('settings', [Admin\SettingController::class, 'update']);
        });
    });
});
