<?php

namespace App\Http\Controllers\Api\Web;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        try {
            $notifications = Notification::where('user_id', $request->user()->user_id)
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            return response()->json($notifications);
        } catch (\Exception $e) {
            Log::error('Failed to fetch notifications: ' . $e->getMessage());
            return response()->json([], 500);
        }
    }

    public function unreadCount(Request $request)
    {
        try {
            $count = Notification::where('user_id', $request->user()->user_id)
                ->where('is_read', false)
                ->count();

            return response()->json(['unread_count' => $count]);
        } catch (\Exception $e) {
            return response()->json(['unread_count' => 0], 500);
        }
    }

    public function markAsRead(Request $request, $id)
    {
        try {
            $notification = Notification::where('notification_id', $id)
                ->where('user_id', $request->user()->user_id)
                ->firstOrFail();

            $notification->is_read = true;
            $notification->read_at = now();
            $notification->save();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false], 404);
        }
    }

    public function markAllAsRead(Request $request)
    {
        try {
            Notification::where('user_id', $request->user()->user_id)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now()
                ]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $notification = Notification::where('notification_id', $id)
                ->where('user_id', $request->user()->user_id)
                ->firstOrFail();

            $notification->delete();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false], 404);
        }
    }
}