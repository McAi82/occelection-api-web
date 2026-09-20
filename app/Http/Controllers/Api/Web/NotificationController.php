<?php

namespace App\Http\Controllers\Api\Web;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the current user.
     */
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

    /**
     * Get unread count for badge display.
     */
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

    /**
     * Polling endpoint — returns notifications newer than `since_id`
     * along with the current unread count.
     *
     * Example:
     *   GET /api/web/notifications/poll?since_id=42
     *
     * Response:
     *   {
     *     success: true,
     *     notifications: [...],
     *     unread_count: 3,
     *     latest_id: 45,
     *     server_time: "2026-09-20T06:00:00.000000Z"
     *   }
     */
    public function poll(Request $request)
    {
        try {
            $user = $request->user();
            $sinceId = (int) $request->get('since_id', 0);

            // New notifications since `since_id` (newest first)
            $notifications = Notification::where('user_id', $user->user_id)
                ->when($sinceId > 0, function ($q) use ($sinceId) {
                    $q->where('notification_id', '>', $sinceId);
                })
                ->orderBy('notification_id', 'desc')
                ->limit(20)
                ->get();

            // Current total unread count (independent of since_id)
            $unreadCount = Notification::where('user_id', $user->user_id)
                ->where('is_read', false)
                ->count();

            // The highest notification_id in this response.
            // Fall back to `sinceId` if nothing new was found.
            $latestId = $notifications->isNotEmpty()
                ? (int) $notifications->first()->notification_id
                : $sinceId;

            return response()->json([
                'success'       => true,
                'notifications' => $notifications,
                'unread_count'  => $unreadCount,
                'latest_id'     => $latestId,
                'server_time'   => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Notification poll failed: ' . $e->getMessage());
            return response()->json([
                'success'       => false,
                'notifications' => [],
                'unread_count'  => 0,
                'latest_id'     => 0,
                'message'       => 'Polling failed',
            ], 500);
        }
    }

    /**
     * Mark a single notification as read.
     */
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

    /**
     * Mark all notifications as read for the current user.
     */
    public function markAllAsRead(Request $request)
    {
        try {
            Notification::where('user_id', $request->user()->user_id)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false], 500);
        }
    }

    /**
     * Delete a single notification.
     */
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