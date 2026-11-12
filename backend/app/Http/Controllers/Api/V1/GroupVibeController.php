<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GroupVibe;
use App\Models\GroupVibeMember;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupVibeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vibes = GroupVibe::with(['host.profile', 'acceptedMembers.user.profile'])
            ->where('is_active', true)
            ->where(fn($q) => $q->whereNull('scheduled_at')->orWhere('scheduled_at', '>=', now()))
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn($vibe) => $this->format($vibe, $request->user()));

        return response()->json(['success' => true, 'data' => $vibes]);
    }

    public function mine(Request $request): JsonResponse
    {
        $user = $request->user();

        $vibes = GroupVibe::with(['host.profile', 'acceptedMembers.user.profile'])
            ->where(function ($q) use ($user) {
                $q->where('host_id', $user->id)
                  ->orWhereHas('members', fn($q2) => $q2->where('user_id', $user->id)->where('status', 'accepted'));
            })
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn($vibe) => $this->format($vibe, $user));

        return response()->json(['success' => true, 'data' => $vibes]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:100'],
            'description'  => ['nullable', 'string', 'max:500'],
            'activity'     => ['nullable', 'string', 'max:100'],
            'location'     => ['nullable', 'string', 'max:200'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
            'max_members'  => ['nullable', 'integer', 'min:2', 'max:20'],
        ]);

        $vibe = GroupVibe::create([...$validated, 'host_id' => $request->user()->id]);

        GroupVibeMember::create([
            'group_vibe_id' => $vibe->id,
            'user_id'       => $request->user()->id,
            'status'        => 'accepted',
        ]);

        $vibe->load(['host.profile', 'acceptedMembers.user.profile']);

        return response()->json([
            'success' => true,
            'message' => 'Group Vibe created!',
            'data'    => $this->format($vibe, $request->user()),
        ], 201);
    }

    public function join(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $vibe = GroupVibe::with('acceptedMembers')->findOrFail($id);

        if ($vibe->host_id === $user->id) {
            return response()->json(['success' => false, 'message' => 'You are the host.'], 422);
        }

        if (!$vibe->is_active || ($vibe->scheduled_at && $vibe->scheduled_at->isPast())) {
            return response()->json(['success' => false, 'message' => 'This group vibe is no longer active.'], 422);
        }

        if ($vibe->acceptedMembers->count() >= $vibe->max_members) {
            return response()->json(['success' => false, 'message' => 'This group vibe is full.'], 422);
        }

        $member = GroupVibeMember::firstOrCreate(
            ['group_vibe_id' => $vibe->id, 'user_id' => $user->id],
            ['status' => 'accepted', 'joined_at' => now()]
        );

        try {
            $vibe->load('host');
            $joinerName = $user->profile?->display_name ?? $user->name;
            NotificationService::send($vibe->host, $user, 'group_vibe_joined', "{$joinerName} joined your group vibe \"{$vibe->title}\"");
        } catch (\Throwable) {}

        return response()->json([
            'success' => true,
            'message' => 'You joined the group vibe! 🎉',
            'data'    => ['member_id' => $member->id],
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $vibe = GroupVibe::findOrFail($id);

        if ($vibe->host_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Only the host can edit this group vibe.'], 403);
        }

        $validated = $request->validate([
            'title'        => ['sometimes', 'string', 'max:100'],
            'description'  => ['nullable', 'string', 'max:500'],
            'activity'     => ['nullable', 'string', 'max:100'],
            'location'     => ['nullable', 'string', 'max:200'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
            'max_members'  => ['nullable', 'integer', 'min:2', 'max:20'],
        ]);

        $vibe->update($validated);
        $vibe->load(['host.profile', 'acceptedMembers.user.profile']);

        return response()->json([
            'success' => true,
            'message' => 'Group vibe updated!',
            'data'    => $this->format($vibe, $request->user()),
        ]);
    }

    public function invite(Request $request, string $id): JsonResponse
    {
        $vibe = GroupVibe::findOrFail($id);
        $user = $request->user();

        if (!$vibe->is_active) {
            return response()->json(['success' => false, 'message' => 'This group vibe is no longer active.'], 422);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $invitee = User::findOrFail($validated['user_id']);
        $inviterName = $user->profile?->display_name ?? $user->name;

        try {
            NotificationService::send(
                $invitee,
                $user,
                'group_vibe_invite',
                "{$inviterName} invited you to join \"{$vibe->title}\""
            );
        } catch (\Throwable) {}

        return response()->json(['success' => true, 'message' => 'Invitation sent!']);
    }

    public function leave(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $vibe = GroupVibe::findOrFail($id);

        if ($vibe->host_id === $user->id) {
            $vibe->update(['is_active' => false]);
            return response()->json(['success' => true, 'message' => 'Group vibe cancelled.']);
        }

        GroupVibeMember::where('group_vibe_id', $vibe->id)
            ->where('user_id', $user->id)
            ->delete();

        return response()->json(['success' => true, 'message' => 'You left the group vibe.']);
    }

    private function format(GroupVibe $vibe, ?User $user): array
    {
        $memberCount = $vibe->acceptedMembers->count();
        $isHost      = $user && $vibe->host_id === $user->id;
        $isMember    = $user && $vibe->acceptedMembers->contains('user_id', $user->id);

        return [
            'id'              => $vibe->id,
            'title'           => $vibe->title,
            'description'     => $vibe->description,
            'activity'        => $vibe->activity,
            'location'        => $vibe->location,
            'scheduled_at'    => $vibe->scheduled_at?->toISOString(),
            'scheduled_label' => $vibe->scheduled_at?->format('D, d M · g:i a'),
            'max_members'     => $vibe->max_members,
            'member_count'    => $memberCount,
            'is_full'         => $memberCount >= $vibe->max_members,
            'is_host'         => $isHost,
            'is_member'       => $isMember,
            'is_active'       => $vibe->is_active,
            'host'            => [
                'id'               => $vibe->host->id,
                'display_name'     => $vibe->host->profile?->display_name ?? $vibe->host->name,
                'profile_photo_url' => $vibe->host->profile?->profile_photo_url,
            ],
            'members' => $vibe->acceptedMembers->map(fn($m) => [
                'id'               => $m->user->id,
                'display_name'     => $m->user->profile?->display_name ?? $m->user->name,
                'profile_photo_url' => $m->user->profile?->profile_photo_url,
            ])->values()->all(),
        ];
    }
}
