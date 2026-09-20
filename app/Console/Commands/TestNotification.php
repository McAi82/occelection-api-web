<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Notification;
use Illuminate\Console\Command;

class TestNotification extends Command
{
    protected $signature = 'notification:test {email?}';
    protected $description = 'Send a test notification';

    public function handle()
    {
        $email = $this->argument('email');
        
        if ($email) {
            $user = User::where('email', $email)->first();
        } else {
            $user = User::where('role', 'admin')->first();
        }
        
        if (!$user) {
            $this->error('User not found!');
            return 1;
        }
        
        $notification = Notification::create([
            'user_id' => $user->user_id,
            'title' => 'Test Notification',
            'message' => 'This is a test notification from artisan command!',
            'type' => 'system',
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        $this->info('Test notification sent to: ' . $user->email);
        $this->info('Notification ID: ' . $notification->notification_id);
        
        return 0;
    }
}