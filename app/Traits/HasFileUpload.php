<?php

namespace App\Traits;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait HasFileUpload
{
    /**
     * Upload a file to storage
     */
    protected function uploadFile($file, string $directory, ?string $oldPath = null): ?string
    {
        if ($oldPath) {
            $this->deleteFile($oldPath);
        }

        $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs($directory, $filename, 'public');
        
        return Storage::url($path);
    }

    /**
     * Delete a file from storage
     */
    protected function deleteFile(?string $path): void
    {
        if ($path) {
            $relativePath = str_replace('/storage/', '', $path);
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
            }
        }
    }

    /**
     * Get file URL from path
     */
    protected function getFileUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }
        
        if (str_starts_with($path, 'http')) {
            return $path;
        }
        
        return asset($path);
    }
}