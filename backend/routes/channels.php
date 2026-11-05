<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = \App\Models\Conversation::with('connection')->find($conversationId);
    if (!$conversation) return false;
    $conn = $conversation->connection;
    return $conn && ($conn->user_one_id === $user->id || $conn->user_two_id === $user->id);
});
