<?php
// app/Imports/VotersImport.php

namespace App\Imports;

use App\Models\User;
use App\Models\Course;
use App\Models\Election;
use App\Models\VoterRegistry;
use App\Models\AuditLog;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VotersImport implements ToModel, WithHeadingRow, SkipsOnFailure, WithChunkReading
{
    use SkipsFailures;

    protected int $electionId;
    protected int $importedCount = 0;
    protected int $updatedCount = 0;
    protected int $registeredCount = 0;
    protected array $skippedRows = [];

    /**
     * Department code → Course code mapping
     * Matches the registrar's CSV format
     */
    protected array $departmentMap = [
        'CIT' => 'BSIT',
        'CBA' => 'BSBA',
        'TED' => 'BEED',
    ];

    public function __construct(int $electionId)
    {
        $this->electionId = $electionId;
    }

    /**
     * Process each row from the CSV
     * Expected headers: id_number, last_name, first_name, middle_name, email, department
     */
    public function model(array $row)
    {
        // ✅ Normalize headers (Laravel Excel converts "ID Number" → "id_number")
        $studentId  = trim($row['id_number'] ?? '');
        $lastName   = trim($row['last_name'] ?? '');
        $firstName  = trim($row['first_name'] ?? '');
        $middleName = trim($row['middle_name'] ?? '');
        $email      = strtolower(trim($row['email'] ?? ''));
        $department = strtoupper(trim($row['department'] ?? ''));

        // Skip rows missing critical fields
        if (empty($studentId) || empty($firstName) || empty($lastName) || empty($email)) {
            $this->skippedRows[] = "Missing required fields for: {$studentId}";
            return null;
        }

        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->skippedRows[] = "Invalid email format: {$email} (student: {$studentId})";
            return null;
        }

        // Clean up middle name (null strings, dashes, etc.)
        $middleName = $this->cleanMiddleName($middleName);

        // Map department to course
        $courseId = $this->mapDepartmentToCourse($department);

        // Find or create the user
        $user = User::where('student_id', $studentId)->first();
        $isNewUser = false;

        if ($user) {
            // ✅ UPDATE existing user
            $user->update([
                'first_name' => $firstName,
                'last_name'  => $lastName,
                'email'      => $email,
                'course_id'  => $courseId ?? $user->course_id,
            ]);
            $this->updatedCount++;
        } else {
            // ✅ CREATE new user
            $user = User::create([
                'student_id'    => $studentId,
                'first_name'    => $firstName,
                'last_name'     => $lastName,
                'email'         => $email,
                'password_hash' => Hash::make($studentId), // Default password = student_id
                'course_id'     => $courseId,
                'year_level'    => null, // User will fill in their profile
                'role'          => 'voter',
                'is_active'     => true,
            ]);
            $isNewUser = true;
            $this->importedCount++;
        }

        // ✅ Register voter for the election
        $voterRegistry = VoterRegistry::firstOrCreate(
            [
                'election_id' => $this->electionId,
                'user_id'     => $user->user_id,
            ],
            [
                'has_voted'         => false,
                'sanction_eligible' => false,
            ]
        );

        if ($voterRegistry->wasRecentlyCreated) {
            $this->registeredCount++;
        }

        // Log the action
        AuditLog::create([
            'user_id'      => auth()->id() ?? 1,
            'action_type'  => $isNewUser ? 'IMPORT_VOTER_CREATE' : 'IMPORT_VOTER_UPDATE',
            'target_table' => 'users',
            'target_id'    => $user->user_id,
            'new_value'    => json_encode([
                'student_id' => $studentId,
                'email'      => $email,
                'election_id'=> $this->electionId,
            ]),
            'ip_address'   => request()->ip(),
        ]);

        return null; // We handle persistence manually
    }

    /**
     * Clean up middle name values like "NULL", "N/A", "-", ""
     */
    private function cleanMiddleName(string $middleName): ?string
    {
        $value = strtoupper(trim($middleName));

        if (
            empty($value) ||
            in_array($value, ['NULL', 'N/A', 'NA', 'NONE', '-', '--'])
        ) {
            return null;
        }

        return $middleName;
    }

    /**
     * Map department code to a course ID
     * Returns null if no matching course found
     */
    private function mapDepartmentToCourse(string $department): ?int
    {
        if (empty($department)) {
            return null;
        }

        $courseCode = $this->departmentMap[$department] ?? $department;

        $course = Course::where('course_code', $courseCode)->first();

        if (!$course) {
            Log::warning("Course not found for department: {$department} (mapped to {$courseCode})");
            return null;
        }

        return $course->course_id;
    }

    public function chunkSize(): int
    {
        return 200;
    }

    // ─── Public getters for the controller ──────────────────────────────
    public function getImportedCount(): int
    {
        return $this->importedCount;
    }

    public function getUpdatedCount(): int
    {
        return $this->updatedCount;
    }

    public function getRegisteredCount(): int
    {
        return $this->registeredCount;
    }

    public function getSkippedRows(): array
    {
        return $this->skippedRows;
    }
}