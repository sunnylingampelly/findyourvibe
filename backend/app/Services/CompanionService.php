<?php

namespace App\Services;

use App\Models\CompanionApplication;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CompanionService
{
    public function getOrCreateApplication(User $user): CompanionApplication
    {
        return CompanionApplication::firstOrCreate(
            ['user_id' => $user->id],
            ['legal_name' => $user->name, 'status' => 'draft']
        );
    }

    public function approve(CompanionApplication $application, User $admin): CompanionApplication
    {
        return DB::transaction(function () use ($application, $admin) {
            $application->update([
                'status' => 'approved',
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ]);

            $application->user->profile()->update([
                'is_companion' => true,
                'companion_verification_status' => 'approved',
            ]);

            return $application->fresh();
        });
    }

    public function reject(CompanionApplication $application, User $admin, string $reason): CompanionApplication
    {
        return DB::transaction(function () use ($application, $admin, $reason) {
            $application->update([
                'status' => 'rejected',
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'rejection_reason' => $reason,
            ]);

            $application->user->profile()->update([
                'companion_verification_status' => 'rejected',
            ]);

            return $application->fresh();
        });
    }

    public function requestInformation(CompanionApplication $application, User $admin, string $notes): CompanionApplication
    {
        $application->update([
            'status' => 'additional_info_required',
            'reviewed_by' => $admin->id,
            'admin_notes' => $notes,
        ]);

        $application->user->profile()->update([
            'companion_verification_status' => 'additional_info_required',
        ]);

        return $application->fresh();
    }
}
