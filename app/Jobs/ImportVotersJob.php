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

<<<<<<< HEAD
    public int $timeout = 600;
=======
    /** Allow up to 10 minutes for huge files */
    public int $timeout = 600;

    /** Retry twice on failure, with backoff */
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870
    public int $tries = 3;
    public array $backoff = [30, 120];

    public function __construct(
        public int $electionId,
        public int $adminUserId,
        public string $storedFilePath,
<<<<<<< HEAD
    ) {
        // nothing here — properties are auto-assigned
    }

    public function handle(): void
    {
        Log::info('Starting voter import job', [
=======
    ) {}

    public function handle(): void
    {
        Log::info('📥 Starting voter import job', [
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870
            'election_id' => $this->electionId,
            'admin_id'    => $this->adminUserId,
            'file'        => $this->storedFilePath,
        ]);

<<<<<<< HEAD
=======
        // Raise limits for the job process
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870
        @ini_set('max_execution_time', '600');
        @ini_set('memory_limit', '512M');
        @set_time_limit(600);

        $import = new VotersImport($this->electionId);
<<<<<<< HEAD
        Excel::import(
            $import,
            Storage::disk('local')->path($this->storedFilePath),
        );
=======
        Excel::import($import, Storage::disk('local')->path($this->storedFilePath));
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870

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

<<<<<<< HEAD
        Log::info('Voter import finished', [
=======
        Log::info('✅ Voter import finished', [
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870
            'election_id' => $this->electionId,
            'created'     => $created,
            'updated'     => $updated,
            'registered'  => $registered,
            'skipped'     => $skipped,
        ]);

<<<<<<< HEAD
=======
        // Notify the admin via the DB (polling will pick it up)
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870
        try {
            $admin = User::find($this->adminUserId);
            if ($admin) {
                app(NotificationService::class)->send(
                    $admin->user_id,
<<<<<<< HEAD
                    'Voter Import Complete',
=======
                    '📥 Voter Import Complete',
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870
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

<<<<<<< HEAD
=======
        // Cleanup temp file
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870
        if (Storage::disk('local')->exists($this->storedFilePath)) {
            Storage::disk('local')->delete($this->storedFilePath);
        }
    }

<<<<<<< HEAD
    public function failed(\Throwable $exception): void
    {
        Log::error('Voter import job failed permanently', [
=======
    /**
     * Called after all retries are exhausted.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('❌ Voter import job failed permanently', [
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870
            'election_id' => $this->electionId,
            'admin_id'    => $this->adminUserId,
            'error'       => $exception->getMessage(),
        ]);

        try {
            $admin = User::find($this->adminUserId);
            if ($admin) {
                app(NotificationService::class)->send(
                    $admin->user_id,
<<<<<<< HEAD
                    'Voter Import Failed',
=======
                    '❌ Voter Import Failed',
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870
                    'The import failed after multiple attempts: ' . $exception->getMessage(),
                    'system'
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to notify admin of import failure: ' . $e->getMessage());
        }

<<<<<<< HEAD
=======
        // Clean up on failure too
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870
        if (Storage::disk('local')->exists($this->storedFilePath)) {
            Storage::disk('local')->delete($this->storedFilePath);
        }
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> 01f5d3ea9574930e23037cbf8fc488f3f4e9b870
