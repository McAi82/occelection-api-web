<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('==========================================');
        $this->command->info('Starting OCC Election System Database Seeder');
        $this->command->info('==========================================');

        // ==================== 1. CREATE COURSES ====================
        $this->command->info("\n📚 Creating courses...");

        $courses = [
            ['course_code' => 'BSIT', 'course_name' => 'Bachelor of Science in Information Technology', 'department' => 'College of Computing'],
            ['course_code' => 'BEED', 'course_name' => 'Bachelor of Elementary Education', 'department' => 'College of Education'],
            ['course_code' => 'BSBA', 'course_name' => 'Bachelor of Science in Business Administration', 'department' => 'College of Business'],
        ];

        $courseIds = [];
        foreach ($courses as $course) {
            $id = DB::table('courses')->insertGetId([
                'course_code' => $course['course_code'],
                'course_name' => $course['course_name'],
                'department' => $course['department'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $courseIds[$course['course_code']] = $id;
            $this->command->info("   ✓ Created {$course['course_code']}");
        }

        // ==================== 2. CREATE COURSE SECTIONS ====================
        $this->command->info("\n📖 Creating course sections...");

        $sections = ['A', 'B'];
        $yearLevels = [1, 2, 3, 4];

        $sectionIds = [];
        $sectionCounter = 0;

        foreach ($courseIds as $courseCode => $courseId) {
            foreach ($yearLevels as $yearLevel) {
                foreach ($sections as $section) {
                    $sectionCounter++;
                    $sectionId = DB::table('course_sections')->insertGetId([
                        'course_id' => $courseId,
                        'section_code' => $section,
                        'section_name' => "Section {$section}",
                        'year_level' => $yearLevel,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $sectionIds["{$courseCode}-Y{$yearLevel}-{$section}"] = $sectionId;
                }
            }
        }

        $this->command->info("   ✓ Created {$sectionCounter} sections (3 courses × 4 years × 2 sections = 24 sections)");

        // ==================== 3. CREATE ADMIN USER ====================
        $this->command->info("\n👤 Creating admin user...");

        DB::table('users')->insert([
            'email' => 'admin@occelection.com',
            'password_hash' => Hash::make('admin123'),
            'first_name' => 'System',
            'last_name' => 'Admin',
            'student_id' => 'ADMIN001',
            'course_id' => $courseIds['BSIT'],
            'section_id' => $sectionIds['BSIT-Y1-A'],
            'year_level' => null,
            'role' => 'admin',
            'is_active' => true,
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info("   ✓ Created Admin: admin@occelection.com / admin123");

        // ==================== 4. CREATE COMELEC USERS ====================
        $this->command->info("\n👥 Creating COMELEC users...");

        $comelecUsers = [
            [
                'email' => 'comelec1@occelection.com',
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'student_id' => 'COM001',
                'course' => 'BSIT',
                'section' => 'A',
                'year' => 3,
            ],
            [
                'email' => 'comelec2@occelection.com',
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'student_id' => 'COM002',
                'course' => 'BSBA',
                'section' => 'B',
                'year' => 3,
            ],
            [
                'email' => 'comelec3@occelection.com',
                'first_name' => 'Pedro',
                'last_name' => 'Reyes',
                'student_id' => 'COM003',
                'course' => 'BEED',
                'section' => 'A',
                'year' => 4,
            ],
        ];

        foreach ($comelecUsers as $user) {
            DB::table('users')->insert([
                'email' => $user['email'],
                'password_hash' => Hash::make('comelec123'),
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'student_id' => $user['student_id'],
                'course_id' => $courseIds[$user['course']],
                'section_id' => $sectionIds["{$user['course']}-Y{$user['year']}-{$user['section']}"],
                'year_level' => $user['year'],
                'role' => 'comelec',
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->command->info("   ✓ Created COMELEC: {$user['email']} / comelec123");
        }

        // ==================== COMPLETION SUMMARY ====================
        $this->command->info("\n==========================================");
        $this->command->info("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
        $this->command->info("==========================================\n");

        $this->command->info("📊 SUMMARY:");
        $this->command->info("   • Courses: 3 (BSIT, BEED, BSBA)");
        $this->command->info("   • Sections: {$sectionCounter} (3 courses × 4 years × 2 sections)");
        $this->command->info("   • Admin: 1");
        $this->command->info("   • COMELEC: 3");
        $this->command->info("   • Total Users: 4\n");

        $this->command->info("🔑 LOGIN CREDENTIALS:");
        $this->command->info("   ┌─────────────────────────────────────────────────────────────┐");
        $this->command->info("   │ Admin:     admin@occelection.com / admin123              │");
        $this->command->info("   │ COMELEC 1: comelec1@occelection.com / comelec123         │");
        $this->command->info("   │ COMELEC 2: comelec2@occelection.com / comelec123         │");
        $this->command->info("   │ COMELEC 3: comelec3@occelection.com / comelec123         │");
        $this->command->info("   └─────────────────────────────────────────────────────────────┘");
        $this->command->info("\n==========================================\n");
    }
}