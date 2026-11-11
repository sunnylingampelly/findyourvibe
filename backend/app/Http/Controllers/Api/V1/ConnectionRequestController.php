<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConnectionRequestResource;
use App\Models\ConnectionRequest;
use App\Models\User;
use App\Services\ConnectionService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ConnectionRequestController extends Controller
{
    public function __construct(private ConnectionService $connectionService) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'receiver_id' => ['required', 'exists:users,id', Rule::notIn([$request->user()->id])],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $sender = $request->user();
        $receiver = User::findOrFail($validated['receiver_id']);

        if ($this->connectionService->hasActiveConnection($sender, $receiver)) {
            return response()->json(['success' => false, 'message' => 'You are already connected.'], 422);
        }

        if ($this->connectionService->hasPendingRequest($sender, $receiver)) {
            return response()->json(['success' => false, 'message' => 'Connection request already sent.'], 422);
        }

        $connectionRequest = $this->connectionService->sendRequest($sender, $receiver, $validated['message'] ?? null);

        $senderName = $sender->profile?->display_name ?? $sender->name;
        NotificationService::send($receiver, $sender, 'connection_request', "{$senderName} sent you a connection request");

        return response()->json([
            'success' => true,
            'message' => 'Connection request sent.',
            'data' => new ConnectionRequestResource($connectionRequest->load(['sender', 'receiver'])),
        ], 201);
    }

    public function received(Request $request): JsonResponse
    {
        $requests = $request->user()->connectionRequestsReceived()
            ->with(['sender.profile.country', 'sender.profile.city', 'sender.interests', 'sender.languages'])
            ->where('status', 'pending')
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => ConnectionRequestResource::collection($requests),
        ]);
    }

    public function sent(Request $request): JsonResponse
    {
        $requests = $request->user()->connectionRequestsSent()
            ->with(['receiver.profile.country', 'receiver.profile.city', 'receiver.interests'])
            ->where('status', 'pending')
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => ConnectionRequestResource::collection($requests),
        ]);
    }

    public function accept(Request $request, string $id): JsonResponse
    {
        $connectionRequest = ConnectionRequest::where('receiver_id', $request->user()->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $connection = $this->connectionService->acceptRequest($connectionRequest);

        $acceptorName = $request->user()->profile?->display_name ?? $request->user()->name;
        NotificationService::send($connectionRequest->sender, $request->user(), 'connection_accepted', "{$acceptorName} accepted your connection request");

        return response()->json([
            'success' => true,
            'message' => 'Connection request accepted.',
            'data' => ['connection_id' => $connection->id],
        ]);
    }

    public function decline(Request $request, string $id): JsonResponse
    {
        $connectionRequest = ConnectionRequest::where('receiver_id', $request->user()->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $this->connectionService->declineRequest($connectionRequest);

        return response()->json(['success' => true, 'message' => 'Connection request declined.']);
    }

    public function withdraw(Request $request, string $id): JsonResponse
    {
        $connectionRequest = ConnectionRequest::where('sender_id', $request->user()->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $this->connectionService->withdrawRequest($connectionRequest);

        return response()->json(['success' => true, 'message' => 'Connection request withdrawn.']);
    }
}
