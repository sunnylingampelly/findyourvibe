<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            $cacheKey = 'last_seen_' . $user->id;
            if (!Cache::has($cacheKey)) {
                $user->timestamps = false;
                $user->last_active_at = now();
                $user->save();
                Cache::put($cacheKey, true, 60);
            }
        }
        return $next($request);
    }
}
