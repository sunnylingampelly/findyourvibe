<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Models\Connection;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    public function index(Request $request, string $id): JsonResponse
    {
        $userId = $request->user()->id;
        $conversation = Conversation::findOrFail($id);

        $connection = Connection::findOrFail($conversation->connection_id);
        if ($connection->user_one_id !== $userId && $connection->user_two_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $messages = $conversation->messages()
            ->with(['sender.profile', 'attachments'])
            ->paginate(50);

        $conversation->messages()
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'data' => MessageResource::collection($messages),
        ]);
    }

    public function store(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required_without:attachment', 'nullable', 'string', 'max:5000'],
            'attachment' => ['nullable', 'file', 'mimes:jpeg,jpg,png,webp,gif', 'max:10240'],
        ]);

        $userId = $request->user()->id;
        $conversation = Conversation::findOrFail($id);
        $connection = Connection::findOrFail($conversation->connection_id);

        if ($connection->user_one_id !== $userId && $connection->user_two_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $type = $request->hasFile('attachment') ? 'image' : 'text';

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $userId,
            'body' => $validated['body'] ?? null,
            'type' => $type,
        ]);

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('messages', 'public');
            $message->attachments()->create([
                'file_path' => $path,
                'original_name' => $request->file('attachment')->getClientOriginalName(),
                'mime_type' => $request->file('attachment')->getMimeType(),
            ]);
        }

        $message->load(['sender.profile', 'attachments']);
        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'success' => true,
            'data' => new MessageResource($message),
        ], 201);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $message = Message::findOrFail($id);
        $conversation = $message->conversation;
        $connection = Connection::findOrFail($conversation->connection_id);
        $userId = $request->user()->id;

        if ($connection->user_one_id !== $userId && $connection->user_two_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        if ($message->sender_id !== $userId && !$message->read_at) {
            $message->update(['read_at' => now()]);
        }

        return response()->json(['success' => true, 'message' => 'Marked as read.']);
    }
}
