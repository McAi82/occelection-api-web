<?php
// app/Imports/VotersImport.php

namespace App\Imports;

use App\Models\User;
use App\Models\Course;
use App\Models\VoterRegistry;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class VotersImport implements ToCollection, WithHeadingRow, WithChunkReading
{
    protected int $electionId;
    protected int $importedCount = 0;
    protected int $updatedCount = 0;
    protected int $registeredCount = 0;
    protected array $skippedRows = [];
    protected ?array $courseLookup = null;

    /** Department code → Course code mapping (registrar format) */
    protected array $departmentMap = [
        'CIT' => 'BSIT',
        'CBA' => 'BSBA',
        'TED' => 'BEED',
    ];

    public function __construct(int $electionId)
    {
        $this->electionId = $electionId;
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function collection(Collection $rows): void
    {
        if ($rows->isEmpty()) return;

        // 1. Cache courses once
        if ($this->courseLookup === null) {
            $this->courseLookup = Course::pluck('course_id', 'course_code')->toArray();
        }

        // 2. Parse + validate
        $normalized = [];
        $studentIds = [];
        foreach ($rows as $row) {
            $parsed = $this->parseRow($row);
            if ($parsed === null) continue;
            $normalized[] = $parsed;
            $studentIds[] = $parsed['student_id'];
        }
        if (empty($normalized)) return;

        // 3. Bulk lookup existing users
        $existing = User::whereIn('student_id', $studentIds)
            ->get(['user_id', 'student_id'])
            ->keyBy('student_id')
            ->toArray();

        // 4. Split new vs existing
        $toInsert = [];
        $toUpdate = [];
        $now = now();

        foreach ($normalized as $r) {
            if (isset($existing[$r['student_id']])) {
                $toUpdate[] = [
                    'user_id'    => $existing[$r['student_id']]['user_id'],
                    'first_name' => $r['first_name'],
                    'last_name'  => $r['last_name'],
                    'email'      => $r['email'],
                    'course_id'  => $r['course_id'],
                ];
            } else {
                $toInsert[] = [
                    'student_id'    => $r['student_id'],
                    'first_name'    => $r['first_name'],
                    'last_name'     => $r['last_name'],
                    'email'         => $r['email'],
                    'password_hash' => Hash::make($r['student_id']),
                    'course_id'     => $r['course_id'],
                    'year_level'    => null,
                    'role'          => 'voter',
                    'is_active'     => true,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];
            }
        }

        // 5. Bulk insert new users
        if (!empty($toInsert)) {
            foreach (array_chunk($toInsert, 200) as $chunk) {
                User::insert($chunk);
            }
            $this->importedCount += count($toInsert);
        }

        // 6. Bulk update existing users (in chunks)
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

        // 7. Fetch user_ids for registry
        $allIds = User::whereIn('student_id', $studentIds)
            ->pluck('user_id', 'student_id')
            ->toArray();

        // 8. Bulk insert registries (ignore duplicates)
        $registries = [];
        foreach ($allIds as $userId) {
            $registries[] = [
                'election_id'       => $this->electionId,
                'user_id'           => $userId,
                'has_voted'         => false,
                'sanction_eligible' => false,
                'created_at'        => $now,
                'updated_at'        => $now,
            ];
        }

        if (!empty($registries)) {
            foreach (array_chunk($registries, 500) as $chunk) {
                $this->registeredCount += VoterRegistry::insertOrIgnore($chunk);
            }
        }
    }

    private function parseRow($row): ?array
    {
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
        $courseId   = $this->courseLookup[$courseCode] ?? null;

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

    // ---------- Getters ----------
    public function getImportedCount(): int   { return $this->importedCount; }
    public function getUpdatedCount(): int    { return $this->updatedCount; }
    public function getRegisteredCount(): int { return $this->registeredCount; }
    public function getSkippedRows(): array   { return $this->skippedRows; }
}
