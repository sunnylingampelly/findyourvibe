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
            ->withTrashed()
            ->with(['sender.profile', 'attachments'])
            ->latest()
            ->take(200)
            ->get()
            ->sortBy('created_at')
            ->values();

        $conversation->messages()
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'data' => array_values(MessageResource::collection($messages)->toArray($request)),
        ]);
    }

    public function store(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required_without:attachment', 'nullable', 'string', 'max:5000'],
            'attachment' => ['nullable', 'file', 'max:20480',
                'mimetypes:image/jpeg,image/png,image/webp,image/gif,image/jpg,audio/webm,audio/ogg,audio/mp4,audio/mpeg,audio/wav,audio/aac,audio/opus,video/webm'],
        ]);

        $userId = $request->user()->id;
        $conversation = Conversation::findOrFail($id);
        $connection = Connection::findOrFail($conversation->connection_id);

        if ($connection->user_one_id !== $userId && $connection->user_two_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $type = 'text';
        if ($request->hasFile('attachment')) {
            $mime = $request->file('attachment')->getMimeType() ?? '';
            $type = (str_starts_with($mime, 'audio/') || $mime === 'video/webm') ? 'audio' : 'image';
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $userId,
            'body' => $validated['body'] ?? null,
            'type' => $type,
        ]);

        if ($request->hasFile('attachment')) {
            Storage::disk('public')->makeDirectory('messages');
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

    public function destroy(Request $request, string $conversationId, string $messageId): JsonResponse
    {
        $userId = $request->user()->id;
        $conversation = Conversation::findOrFail($conversationId);
        $connection = Connection::findOrFail($conversation->connection_id);

        if ($connection->user_one_id !== $userId && $connection->user_two_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);

        if ($message->sender_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'You can only delete your own messages.'], 403);
        }

        $message->delete();

        return response()->json(['success' => true]);
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
