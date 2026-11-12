<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\ReactionAdded;
use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageReactionController extends Controller
{
    public function toggle(Request $request, string $messageId): JsonResponse
    {
        $request->validate(['emoji' => 'required|string|max:20']);

        $message = Message::withTrashed()->findOrFail($messageId);
        $userId = $request->user()->id;
        $emoji = $request->emoji;

        $existing = MessageReaction::where('message_id', $messageId)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            if ($existing->emoji === $emoji) {
                $existing->delete();
                broadcast(new ReactionAdded($message->conversation_id, $messageId, $userId, null, true))->toOthers();
                return response()->json(['success' => true, 'removed' => true]);
            }
            $existing->update(['emoji' => $emoji]);
            broadcast(new ReactionAdded($message->conversation_id, $messageId, $userId, $emoji, false))->toOthers();
            return response()->json(['success' => true, 'removed' => false, 'emoji' => $emoji]);
        }

        MessageReaction::create([
            'message_id' => $messageId,
            'user_id' => $userId,
            'emoji' => $emoji,
        ]);

        broadcast(new ReactionAdded($message->conversation_id, $messageId, $userId, $emoji, false))->toOthers();
        return response()->json(['success' => true, 'removed' => false, 'emoji' => $emoji]);
    }
}
