<?php

namespace App\Http\Controllers\Api\Web\Course;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CourseController extends Controller
{
    // Get all active courses (public)
    public function index()
    {
        $courses = Course::where('is_active', true)
            ->orderBy('course_code')
            ->get();
        return response()->json($courses);
    }

    // Get single course
    public function show($id)
    {
        $course = Course::findOrFail($id);
        return response()->json($course);
    }

    // Get course by code
    public function getByCode($courseCode)
    {
        $course = Course::where('course_code', $courseCode)
            ->where('is_active', true)
            ->firstOrFail();
        return response()->json($course);
    }

    // ✅ Get sections by course ID
    public function getSectionsByCourse($courseId)
    {
        $sections = CourseSection::where('course_id', $courseId)
            ->where('is_active', true)
            ->orderBy('year_level')
            ->orderBy('section_code')
            ->get()
            ->map(function($section) {
                return [
                    'section_id' => $section->section_id,
                    'section_code' => $section->section_code,
                    'section_name' => $section->section_name,
                    'year_level' => $section->year_level,
                    'course_id' => $section->course_id,
                ];
            });
        
        return response()->json($sections);
    }

    // ✅ Get all sections (for dropdowns)
    public function getAllSections()
    {
        $sections = CourseSection::with('course')
            ->where('is_active', true)
            ->orderBy('course_id')
            ->orderBy('year_level')
            ->orderBy('section_code')
            ->get()
            ->map(function($section) {
                return [
                    'section_id' => $section->section_id,
                    'section_code' => $section->section_code,
                    'section_name' => $section->section_name,
                    'year_level' => $section->year_level,
                    'course_id' => $section->course_id,
                    'course' => $section->course ? [
                        'course_id' => $section->course->course_id,
                        'course_code' => $section->course->course_code,
                        'course_name' => $section->course->course_name,
                    ] : null,
                    'display_name' => $section->course ? 
                        $section->course->course_code . ' - Year ' . $section->year_level . ' Section ' . $section->section_code : 
                        'Unknown Section',
                ];
            });
        
        return response()->json($sections);
    }

    // Get courses with stats (Admin only)
    public function getCoursesWithStats(Request $request)
    {
        // Check if user is admin or comelec
        if (!in_array($request->user()->role, ['admin', 'comelec'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $courses = Course::withCount('users')
            ->orderBy('course_code')
            ->get()
            ->map(function($course) {
                return [
                    'course_id' => $course->course_id,
                    'course_code' => $course->course_code,
                    'course_name' => $course->course_name,
                    'department' => $course->department,
                    'is_active' => $course->is_active,
                    'student_count' => $course->users_count,
                ];
            });

        return response()->json($courses);
    }

    // Get all courses including inactive (Admin only)
    public function getAllCourses(Request $request)
    {
        if (!in_array($request->user()->role, ['admin', 'comelec'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $courses = Course::orderBy('course_code')->get();
        return response()->json($courses);
    }

    // Create a new course (Admin only)
    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'course_code' => 'required|string|max:20|unique:courses,course_code',
            'course_name' => 'required|string|max:100',
            'department' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $course = Course::create([
            'course_code' => $request->course_code,
            'course_name' => $request->course_name,
            'department' => $request->department,
            'is_active' => true,
        ]);
        
        // Create default sections for this course (A-F for years 1-4)
        $sections = ['A', 'B', 'C', 'D', 'E', 'F'];
        $yearLevels = [1, 2, 3, 4];
        
        foreach ($yearLevels as $yearLevel) {
            foreach ($sections as $section) {
                CourseSection::create([
                    'course_id' => $course->course_id,
                    'section_code' => $section,
                    'section_name' => "Section {$section}",
                    'year_level' => $yearLevel,
                    'capacity' => 60,
                    'is_active' => true,
                ]);
            }
        }

        return response()->json($course, 201);
    }

    // Update a course (Admin only)
    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $course = Course::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'course_code' => 'sometimes|string|max:20|unique:courses,course_code,' . $id . ',course_id',
            'course_name' => 'sometimes|string|max:100',
            'department' => 'nullable|string|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $course->update($request->all());
        
        return response()->json($course);
    }

    // Delete a course (Admin only)
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $course = Course::findOrFail($id);
        
        // Check if course has users
        if ($course->users()->count() > 0) {
            return response()->json(['message' => 'Cannot delete course with existing users'], 400);
        }
        
        // Delete associated sections first
        $course->sections()->delete();
        $course->delete();
        
        return response()->json(['message' => 'Course deleted successfully']);
    }

}