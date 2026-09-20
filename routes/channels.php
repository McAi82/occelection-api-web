<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Private channel for user notifications
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->user_id === (int) $userId;
});

// Public channel for election updates (anyone can listen)
Broadcast::channel('election.{electionId}', function ($user, $electionId) {
    return true;
});

// Admin monitoring channel
Broadcast::channel('admin.monitoring', function ($user) {
    return in_array($user->role, ['admin', 'comelec']);
});