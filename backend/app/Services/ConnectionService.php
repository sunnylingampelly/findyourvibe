<?php

namespace App\Services;

use App\Models\Connection;
use App\Models\ConnectionRequest;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ConnectionService
{
    public function sendRequest(User $sender, User $receiver, ?string $message = null): ConnectionRequest
    {
        $existing = ConnectionRequest::where('sender_id', $sender->id)
            ->where('receiver_id', $receiver->id)
            ->whereIn('status', ['pending'])
            ->first();

        if ($existing) {
            return $existing;
        }

        return ConnectionRequest::create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'status' => 'pending',
            'message' => $message,
        ]);
    }

    public function acceptRequest(ConnectionRequest $request): Connection
    {
        return DB::transaction(function () use ($request) {
            $request->update(['status' => 'accepted']);

            $connection = Connection::firstOrCreate([
                'user_one_id' => $request->sender_id,
                'user_two_id' => $request->receiver_id,
            ], [
                'connected_at' => now(),
            ]);

            Conversation::firstOrCreate(['connection_id' => $connection->id]);

            return $connection;
        });
    }

    public function declineRequest(ConnectionRequest $request): ConnectionRequest
    {
        $request->update(['status' => 'declined']);
        return $request;
    }

    public function withdrawRequest(ConnectionRequest $request): ConnectionRequest
    {
        $request->update(['status' => 'withdrawn']);
        return $request;
    }

    public function hasActiveConnection(User $userOne, User $userTwo): bool
    {
        return Connection::where(function ($q) use ($userOne, $userTwo) {
            $q->where('user_one_id', $userOne->id)->where('user_two_id', $userTwo->id);
        })->orWhere(function ($q) use ($userOne, $userTwo) {
            $q->where('user_one_id', $userTwo->id)->where('user_two_id', $userOne->id);
        })->exists();
    }

    public function hasPendingRequest(User $sender, User $receiver): bool
    {
        return ConnectionRequest::where('sender_id', $sender->id)
            ->where('receiver_id', $receiver->id)
            ->where('status', 'pending')
            ->exists();
    }
}
