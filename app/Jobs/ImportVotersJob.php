<?php
// app/Jobs/ImportVotersJob.php

namespace App\Jobs;

use App\Imports\VotersImport;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ImportVotersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;
    public int $tries = 3;
    public array $backoff = [30, 120];

    public function __construct(
        public int $electionId,
        public int $adminUserId,
        public string $storedFilePath,
    ) {
        // nothing here — properties are auto-assigned
    }

    public function handle(): void
    {
        Log::info('Starting voter import job', [
            'election_id' => $this->electionId,
            'admin_id'    => $this->adminUserId,
            'file'        => $this->storedFilePath,
        ]);

        @ini_set('max_execution_time', '600');
        @ini_set('memory_limit', '512M');
        @set_time_limit(600);

        $import = new VotersImport($this->electionId);
        Excel::import(
            $import,
            Storage::disk('local')->path($this->storedFilePath),
        );

        $created    = $import->getImportedCount();
        $updated    = $import->getUpdatedCount();
        $registered = $import->getRegisteredCount();
        $skipped    = count($import->getSkippedRows());

        $summary = sprintf(
            'Import complete: %d new, %d updated, %d registered, %d skipped.',
            $created,
            $updated,
            $registered,
            $skipped,
        );

        Log::info('Voter import finished', [
            'election_id' => $this->electionId,
            'created'     => $created,
            'updated'     => $updated,
            'registered'  => $registered,
            'skipped'     => $skipped,
        ]);

        try {
            $admin = User::find($this->adminUserId);
            if ($admin) {
                app(NotificationService::class)->send(
                    $admin->user_id,
                    'Voter Import Complete',
                    $summary,
                    'system',
                    [
                        'election_id' => $this->electionId,
                        'created'     => $created,
                        'updated'     => $updated,
                        'registered'  => $registered,
                        'skipped'     => $skipped,
                    ]
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to notify admin: ' . $e->getMessage());
        }

        if (Storage::disk('local')->exists($this->storedFilePath)) {
            Storage::disk('local')->delete($this->storedFilePath);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Voter import job failed permanently', [
            'election_id' => $this->electionId,
            'admin_id'    => $this->adminUserId,
            'error'       => $exception->getMessage(),
        ]);

        try {
            $admin = User::find($this->adminUserId);
            if ($admin) {
                app(NotificationService::class)->send(
                    $admin->user_id,
                    'Voter Import Failed',
                    'The import failed after multiple attempts: ' . $exception->getMessage(),
                    'system'
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to notify admin of import failure: ' . $e->getMessage());
        }

        if (Storage::disk('local')->exists($this->storedFilePath)) {
            Storage::disk('local')->delete($this->storedFilePath);
        }
    }
}
