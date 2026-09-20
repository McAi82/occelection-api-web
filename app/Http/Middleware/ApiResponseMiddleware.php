<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiResponseMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // If response is already JSON and has data, unwrap if needed
        if ($response->headers->get('content-type') === 'application/json') {
            $content = json_decode($response->getContent(), true);
            
            // If response has success/data structure, keep it
            // Otherwise, wrap it
            if ($content && !isset($content['success']) && !isset($content['data'])) {
                $response->setContent(json_encode([
                    'success' => $response->status() === 200,
                    'data' => $content
                ]));
            }
        }
        
        return $response;
    }
}