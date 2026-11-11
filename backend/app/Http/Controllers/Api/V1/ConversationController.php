<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Models\Connection;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $connections = Connection::where('user_one_id', $userId)
            ->orWhere('user_two_id', $userId)
            ->get();

        // Ensure every connection has a conversation record
        foreach ($connections as $connection) {
            Conversation::firstOrCreate(['connection_id' => $connection->id]);
        }

        $conversations = Conversation::whereIn('connection_id', $connections->pluck('id'))
            ->with(['connection.userOne.profile', 'connection.userTwo.profile', 'latestMessage'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => ConversationResource::collection($conversations),
        ]);
    }

    public function clearMessages(Request $request, string $id): JsonResponse
    {
        $userId = $request->user()->id;
        $conversation = Conversation::findOrFail($id);
        $connection = Connection::findOrFail($conversation->connection_id);

        if ($connection->user_one_id !== $userId && $connection->user_two_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $messageIds = Message::withTrashed()->where('conversation_id', $id)->pluck('id');
        MessageAttachment::whereIn('message_id', $messageIds)->delete();
        Message::withTrashed()->where('conversation_id', $id)->forceDelete();

        return response()->json(['success' => true]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connection_id' => ['required', 'exists:connections,id'],
        ]);

        $userId = $request->user()->id;
        $connection = Connection::where('id', $validated['connection_id'])
            ->where(fn($q) => $q->where('user_one_id', $userId)->orWhere('user_two_id', $userId))
            ->firstOrFail();

        $conversation = Conversation::firstOrCreate(['connection_id' => $connection->id]);

        return response()->json([
            'success' => true,
            'data' => new ConversationResource($conversation->load(['connection.userOne.profile', 'connection.userTwo.profile'])),
        ]);
    }
}
