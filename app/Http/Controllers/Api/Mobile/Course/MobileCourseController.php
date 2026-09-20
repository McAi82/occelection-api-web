<?php

namespace App\Http\Controllers\Api\Mobile\Course;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

class MobileCourseController extends Controller
{
    /**
     * Get All Courses
     * GET /api/mobile/courses
     */
    public function index()
    {
        $courses = Course::where('is_active', true)
            ->select('course_id', 'course_code', 'course_name')
            ->orderBy('course_code')
            ->get();
        
        return response()->json([
            'success' => true,
            'courses' => $courses
        ]);
    }

    /**
     * Get Course by ID
     * GET /api/mobile/courses/{id}
     */
    public function show($id)
    {
        $course = Course::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'course' => $course
        ]);
    }
}