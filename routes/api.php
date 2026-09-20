<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\NotificationController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Include platform-specific routes
require __DIR__ . '/api_mobile.php';
require __DIR__ . '/api_web.php';

// Fallback for undefined routes
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API endpoint not found'
    ], 404);
});