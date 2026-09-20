<?php

namespace App\Traits;

use App\Models\AuditLog;

trait HasAuditLog
{
    protected function logAction($userId, $actionType, $targetTable, $targetId = null, $oldValue = null, $newValue = null, $ipAddress = null)
    {
        try {
            AuditLog::create([
                'user_id' => $userId,
                'action_type' => $actionType,
                'target_table' => $targetTable,
                'target_id' => $targetId,
                'old_value' => $oldValue ? json_encode($oldValue) : null,
                'new_value' => $newValue ? json_encode($newValue) : null,
                'ip_address' => $ipAddress,
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to log action: ' . $e->getMessage());
            // Don't throw, just log the error
        }
    }
}