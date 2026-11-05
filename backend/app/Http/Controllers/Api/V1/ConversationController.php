<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Models\Connection;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $connectionIds = Connection::where('user_one_id', $userId)
            ->orWhere('user_two_id', $userId)
            ->pluck('id');

        $conversations = Conversation::whereIn('connection_id', $connectionIds)
            ->with(['connection.userOne.profile', 'connection.userTwo.profile'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => ConversationResource::collection($conversations),
        ]);
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
