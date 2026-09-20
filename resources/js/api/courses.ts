// resources/js/api/courses.ts
import axios from "./axios";

export interface Course {
    course_id: number;
    course_code: string;
    course_name: string;
    department: string;
    is_active: boolean;
}

export interface CourseSection {
    section_id: number;
    section_code: string;
    section_name: string;
    year_level: number;
    course_id: number;
    capacity: number;
    is_active: boolean;
    course?: Course;
    display_name?: string;
}

export const courseAPI = {
    // Get all courses
    getAll: (): Promise<{ data: Course[] }> => axios.get("/courses"),

    // Get single course
    getById: (id: number): Promise<{ data: Course }> =>
        axios.get(`/courses/${id}`),

    // Get course by code
    getByCode: (code: string): Promise<{ data: Course }> =>
        axios.get(`/courses/code/${code}`),

    // Get sections by course
    getSectionsByCourse: (
        courseId: number,
    ): Promise<{ data: CourseSection[] }> =>
        axios.get(`/courses/${courseId}/sections`),

    // ✅ Get all sections (for dropdowns)
    getAllSections: (): Promise<{ data: CourseSection[] }> =>
        axios.get("/sections"),

    // Get courses with stats (admin only)
    getCoursesWithStats: (): Promise<{ data: any[] }> =>
        axios.get("/admin/courses/with-stats"),

    // Admin: Get all courses (including inactive)
    getAllCoursesAdmin: (): Promise<{ data: Course[] }> =>
        axios.get("/admin/courses"),

    // Admin: Create course
    create: (data: Partial<Course>): Promise<{ data: Course }> =>
        axios.post("/admin/courses", data),

    // Admin: Update course
    update: (id: number, data: Partial<Course>): Promise<{ data: Course }> =>
        axios.put(`/admin/courses/${id}`, data),

    // Admin: Delete course
    delete: (id: number): Promise<{ data: any }> =>
        axios.delete(`/admin/courses/${id}`),
};
