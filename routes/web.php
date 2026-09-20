<?php
// routes/web.php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| These routes are for serving your React SPA
| API routes are in api.php
|
*/

// Serve the React SPA for all routes (except API, storage, etc.)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|storage|sanctum|_ignition|_debugbar|telescope).*$');