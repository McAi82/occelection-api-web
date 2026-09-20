<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;
    public $userId;

    public function __construct(Notification $notification, $userId)
    {
        $this->notification = $notification;
        $this->userId = $userId;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->userId),
        ];
    }

    // ✅ Make sure this matches the frontend listener
    public function broadcastAs(): string
    {
        return 'NewNotification';
    }

    public function broadcastWith(): array
    {
        return [
            'notification' => [
                'notification_id' => $this->notification->notification_id,
                'user_id' => $this->notification->user_id,
                'title' => $this->notification->title,
                'message' => $this->notification->message,
                'type' => $this->notification->type,
                'is_read' => $this->notification->is_read,
                'data' => $this->notification->data,
                'created_at' => $this->notification->created_at,
            ],
            'timestamp' => now()->toISOString(),
        ];
    }
}