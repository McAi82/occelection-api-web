<?php
// app/Imports/VotersImport.php

namespace App\Imports;

use App\Models\User;
use App\Models\Course;
use App\Models\VoterRegistry;
use App\Models\AuditLog;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class VotersImport implements ToCollection, WithHeadingRow, WithChunkReading
{
    protected int $electionId;
    protected int $importedCount = 0;
    protected int $updatedCount = 0;
    protected int $registeredCount = 0;
    protected array $skippedRows = [];

    // Department → course_code mapping
    protected array $departmentMap = [
        'CIT' => 'BSIT',
        'CBA' => 'BSBA',
        'TED' => 'BEED',
    ];

    // Cached lookups (loaded once)
    protected ?array $courseLookup = null;

    public function __construct(int $electionId)
    {
        $this->electionId = $electionId;
    }

    public function chunkSize(): int
    {
        return 500;
    }

    /**
     * Process a chunk of rows.
     */
    public function collection(Collection $rows)
    {
        if ($rows->isEmpty()) {
            return;
        }

        // 1. Ensure course lookup is loaded once
        if ($this->courseLookup === null) {
            $this->courseLookup = Course::pluck('course_id', 'course_code')
                ->toArray();
        }

        // 2. Parse + validate rows → normalized array
        $normalized = [];
        $studentIds = [];

        foreach ($rows as $index => $row) {
            $parsed = $this->parseRow($row);
            if ($parsed === null) {
                continue;
            }
            $normalized[] = $parsed;
            $studentIds[] = $parsed['student_id'];
        }

        if (empty($normalized)) {
            return;
        }

        // 3. Bulk-fetch existing users by student_id (1 query)
        $existing = User::whereIn('student_id', $studentIds)
            ->get(['user_id', 'student_id'])
            ->keyBy('student_id')
            ->toArray();

        // 4. Separate new vs existing
        $toInsert = [];
        $toUpdate = []; // we'll update these individually (small counts)
        $now = now();

        foreach ($normalized as $row) {
            if (isset($existing[$row['student_id']])) {
                // Existing user → queue for update
                $toUpdate[] = [
                    'user_id'    => $existing[$row['student_id']]['user_id'],
                    'first_name' => $row['first_name'],
                    'last_name'  => $row['last_name'],
                    'email'      => $row['email'],
                    'course_id'  => $row['course_id'],
                ];
            } else {
                // New user → queue for insert
                $toInsert[] = [
                    'student_id'    => $row['student_id'],
                    'first_name'    => $row['first_name'],
                    'last_name'     => $row['last_name'],
                    'email'         => $row['email'],
                    'password_hash' => Hash::make($row['student_id']),
                    'course_id'     => $row['course_id'],
                    'year_level'    => null,
                    'role'          => 'voter',
                    'is_active'     => true,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];
            }
        }

        // 5. Batch-insert new users (1 query)
        if (!empty($toInsert)) {
            // Insert in smaller sub-batches to avoid hitting parameter limits
            foreach (array_chunk($toInsert, 200) as $chunk) {
                User::insert($chunk);
            }
            $this->importedCount += count($toInsert);
        }

        // 6. Batch-update existing users (1 query per column using CASE)
        // For simplicity and safety, we'll do a single upsert-style update.
        if (!empty($toUpdate)) {
            DB::transaction(function () use ($toUpdate) {
                foreach ($toUpdate as $u) {
                    User::where('user_id', $u['user_id'])->update([
                        'first_name' => $u['first_name'],
                        'last_name'  => $u['last_name'],
                        'email'      => $u['email'],
                        'course_id'  => $u['course_id'],
                    ]);
                }
            });
            $this->updatedCount += count($toUpdate);
        }

        // 7. Fetch all user_ids that now exist (both new and existing)
        $allIds = User::whereIn('student_id', $studentIds)
            ->pluck('user_id', 'student_id')
            ->toArray();

        // 8. Batch-insert voter registries (skip duplicates via ignore)
        $registries = [];
        foreach ($allIds as $studentId => $userId) {
            $registries[] = [
                'election_id'      => $this->electionId,
                'user_id'          => $userId,
                'has_voted'        => false,
                'sanction_eligible'=> false,
                'created_at'       => $now,
                'updated_at'       => $now,
            ];
        }

        if (!empty($registries)) {
            $inserted = 0;
            foreach (array_chunk($registries, 500) as $chunk) {
                $inserted += VoterRegistry::insertOrIgnore($chunk);
            }
            $this->registeredCount += $inserted;
        }
    }

    /**
     * Parse and validate a single row.
     * Returns null if the row should be skipped.
     */
    private function parseRow($row): ?array
    {
        // Laravel Excel converts "ID Number" → "id_number", etc.
        $studentId  = trim($row['id_number'] ?? '');
        $lastName   = trim($row['last_name'] ?? '');
        $firstName  = trim($row['first_name'] ?? '');
        $middleName = trim($row['middle_name'] ?? '');
        $email      = strtolower(trim($row['email'] ?? ''));
        $department = strtoupper(trim($row['department'] ?? ''));

        if (empty($studentId) || empty($firstName) || empty($lastName) || empty($email)) {
            $this->skippedRows[] = "Missing fields for: {$studentId}";
            return null;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->skippedRows[] = "Invalid email: {$email} (student: {$studentId})";
            return null;
        }

        $courseCode = $this->departmentMap[$department] ?? $department;
        $courseId = $this->courseLookup[$courseCode] ?? null;

        return [
            'student_id'  => $studentId,
            'first_name'  => $firstName,
            'last_name'   => $lastName,
            'middle_name' => $this->cleanMiddleName($middleName),
            'email'       => $email,
            'course_id'   => $courseId,
        ];
    }

    private function cleanMiddleName(string $middleName): ?string
    {
        $value = strtoupper(trim($middleName));
        if (empty($value) || in_array($value, ['NULL', 'N/A', 'NA', 'NONE', '-', '--'])) {
            return null;
        }
        return $middleName;
    }

    // ---------- Getters for the controller ----------
    public function getImportedCount(): int { return $this->importedCount; }
    public function getUpdatedCount(): int { return $this->updatedCount; }
    public function getRegisteredCount(): int { return $this->registeredCount; }
    public function getSkippedRows(): array { return $this->skippedRows; }
}
