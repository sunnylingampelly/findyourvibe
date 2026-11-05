<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConnectionResource;
use App\Models\Connection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConnectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $connections = Connection::where('user_one_id', $userId)
            ->orWhere('user_two_id', $userId)
            ->with(['userOne.profile.country', 'userOne.profile.city', 'userTwo.profile.country', 'userTwo.profile.city', 'conversation'])
            ->latest('connected_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => ConnectionResource::collection($connections),
        ]);
    }
}
