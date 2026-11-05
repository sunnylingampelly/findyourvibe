<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUlids, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'password', 'mobile', 'country_code',
        'role', 'account_status', 'email_verified_at',
        'mobile_verified_at', 'onboarding_completed_at', 'last_active_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'mobile_verified_at' => 'datetime',
            'onboarding_completed_at' => 'datetime',
            'last_active_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function profilePhotos(): HasMany
    {
        return $this->hasMany(UserProfilePhoto::class)->orderBy('sort_order');
    }

    public function preferences(): HasOne
    {
        return $this->hasOne(UserPreferences::class);
    }

    public function interests(): BelongsToMany
    {
        return $this->belongsToMany(Interest::class, 'user_interests');
    }

    public function languages(): BelongsToMany
    {
        return $this->belongsToMany(Language::class, 'user_languages');
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'user_services');
    }

    public function swipesGiven(): HasMany
    {
        return $this->hasMany(Swipe::class, 'swiper_id');
    }

    public function swipesReceived(): HasMany
    {
        return $this->hasMany(Swipe::class, 'swiped_id');
    }

    public function savedProfiles(): HasMany
    {
        return $this->hasMany(SavedProfile::class);
    }

    public function connectionRequestsSent(): HasMany
    {
        return $this->hasMany(ConnectionRequest::class, 'sender_id');
    }

    public function connectionRequestsReceived(): HasMany
    {
        return $this->hasMany(ConnectionRequest::class, 'receiver_id');
    }

    public function connectionsAsUserOne(): HasMany
    {
        return $this->hasMany(Connection::class, 'user_one_id');
    }

    public function connectionsAsUserTwo(): HasMany
    {
        return $this->hasMany(Connection::class, 'user_two_id');
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function userReports(): HasMany
    {
        return $this->hasMany(UserReport::class, 'reporter_id');
    }

    public function blockedUsers(): HasMany
    {
        return $this->hasMany(UserBlock::class, 'blocker_id');
    }

    public function companionApplication(): HasOne
    {
        return $this->hasOne(CompanionApplication::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AdminAuditLog::class, 'admin_id');
    }

    public function scopeActive($query)
    {
        return $query->where('account_status', 'active');
    }

    public function scopeCompanion($query)
    {
        return $query->whereHas('profile', fn($q) =>
            $q->where('is_companion', true)->where('companion_verification_status', 'approved')
        );
    }

    public function isAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isCompanion(): bool
    {
        return $this->profile?->is_companion && $this->profile?->companion_verification_status === 'approved';
    }

    public function isSuspended(): bool
    {
        return $this->account_status === 'suspended';
    }

    public function getAllConnections()
    {
        $ids1 = $this->connectionsAsUserOne()->pluck('user_two_id');
        $ids2 = $this->connectionsAsUserTwo()->pluck('user_one_id');
        return $ids1->merge($ids2);
    }
}
