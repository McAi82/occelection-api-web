<?php

namespace App\Http\Controllers\Api\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;

class BroadcastController extends Controller
{
    public function authenticate(Request $request)
    {
        // This will handle Pusher authentication
        return Broadcast::auth($request);
    }
}