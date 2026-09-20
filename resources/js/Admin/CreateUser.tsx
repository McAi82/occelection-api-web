// resources/js/pages/Admin/CreateUser.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { adminAPI, CreateUserData } from "../api/admin";
import { courseAPI } from "../api/courses";
import {
    UserPlus,
    Mail,
    Lock,
    User,
    GraduationCap,
    Shield,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";

interface Course {
    course_id: number;
    course_code: string;
    course_name: string;
}

interface CourseSection {
    section_id: number;
    section_code: string;
    section_name: string;
    year_level: number;
    course_id: number;
}

const CreateUser: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredSections, setFilteredSections] = useState<CourseSection[]>(
        [],
    );
    const [formData, setFormData] = useState<CreateUserData>({
        first_name: "",
        last_name: "",
        email: "",
        student_id: "",
        course_id: null,
        section_id: null,
        year_level: null,
        role: "comelec",
        password: "",
    });

    // Fetch courses on mount
    useEffect(() => {
        fetchCourses();
    }, []);

    // Fetch sections when course changes
    useEffect(() => {
        if (formData.course_id) {
            fetchSections(formData.course_id);
        } else {
            setFilteredSections([]);
        }
    }, [formData.course_id]);

    const fetchCourses = async () => {
        try {
            const response = await courseAPI.getAll();
            setCourses(response.data || []);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        }
    };

    const fetchSections = async (courseId: number) => {
        try {
            const response = await courseAPI.getSectionsByCourse(courseId);
            const sectionsData = response.data || [];
            setFilteredSections(sectionsData);
        } catch (error) {
            console.error("Failed to fetch sections:", error);
        }
    };

    const handleChange = (
        field: keyof CreateUserData,
        value: string | number | null,
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error for this field
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setErrors({});
        setSuccess("");

        const submitData = {
            ...formData,
            role: "comelec",
        };

        try {
            const response = await adminAPI.createUser(submitData);
            console.log("User created:", response.data);
            setSuccess(
                `COMELEC user "${formData.first_name} ${formData.last_name}" created successfully!`,
            );
            setFormData({
                first_name: "",
                last_name: "",
                email: "",
                student_id: "",
                course_id: null,
                section_id: null,
                year_level: null,
                role: "comelec",
                password: "",
            });
            setTimeout(() => {
                navigate("/admin/users/list");
            }, 2500);
        } catch (err: any) {
            console.error("Failed to create user:", err);

            if (err.response?.status === 422) {
                const serverErrors = err.response?.data?.errors;
                if (serverErrors) {
                    const fieldErrors: Record<string, string> = {};
                    Object.keys(serverErrors).forEach((key) => {
                        fieldErrors[key] =
                            serverErrors[key][0] || "Invalid value";
                    });
                    setErrors(fieldErrors);
                    setError("Please fix the highlighted fields.");
                } else {
                    setError(
                        err.response?.data?.message ||
                            "Validation failed. Please check your inputs.",
                    );
                }
            } else {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to create user. Please try again.";
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const getFieldError = (field: string): string | null => {
        return errors[field] || null;
    };

    const renderFieldWithError = (field: string, children: React.ReactNode) => {
        const error = getFieldError(field);
        return (
            <div>
                {children}
                {error && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                    </p>
                )}
            </div>
        );
    };

    const yearLevels = [1, 2, 3, 4];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/admin/users")}
                        className="mb-2 -ml-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Create COMELEC User
                    </h1>
                    <p className="text-gray-600">
                        Create a new COMELEC account for election management
                    </p>
                </div>
                <Badge className="bg-blue-600 text-white border-0 px-4 py-2">
                    <Shield className="w-4 h-4 mr-1" /> COMELEC Only
                </Badge>
            </div>

            {success && (
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">
                        {success}
                    </AlertDescription>
                </Alert>
            )}

            {error && !Object.keys(errors).length && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-blue-600 px-6 py-4">
                    <div className="flex items-center gap-2 text-white">
                        <UserPlus className="w-5 h-5" />
                        <span className="font-semibold text-lg">
                            New COMELEC Account
                        </span>
                    </div>
                </div>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600" />
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">
                                        First Name *
                                    </Label>
                                    {renderFieldWithError(
                                        "first_name",
                                        <Input
                                            id="first_name"
                                            placeholder="Enter first name"
                                            value={formData.first_name}
                                            onChange={(e) =>
                                                handleChange(
                                                    "first_name",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="rounded-lg"
                                        />,
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">
                                        Last Name *
                                    </Label>
                                    {renderFieldWithError(
                                        "last_name",
                                        <Input
                                            id="last_name"
                                            placeholder="Enter last name"
                                            value={formData.last_name}
                                            onChange={(e) =>
                                                handleChange(
                                                    "last_name",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="rounded-lg"
                                        />,
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Account Information */}
                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-blue-600" />
                                Account Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email Address *
                                    </Label>
                                    {renderFieldWithError(
                                        "email",
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="comelec@occ.edu.ph"
                                            value={formData.email}
                                            onChange={(e) =>
                                                handleChange(
                                                    "email",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="rounded-lg"
                                        />,
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    {renderFieldWithError(
                                        "password",
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Min 8 characters"
                                            value={formData.password}
                                            onChange={(e) =>
                                                handleChange(
                                                    "password",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            minLength={8}
                                            className="rounded-lg"
                                        />,
                                    )}
                                    <p className="text-xs text-gray-500">
                                        Password must be at least 8 characters
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* School Information */}
                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-blue-600" />
                                School Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="student_id">
                                        Student ID *
                                    </Label>
                                    {renderFieldWithError(
                                        "student_id",
                                        <Input
                                            id="student_id"
                                            placeholder="Enter student ID"
                                            value={formData.student_id}
                                            onChange={(e) =>
                                                handleChange(
                                                    "student_id",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="rounded-lg"
                                        />,
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="year_level">
                                        Year Level
                                    </Label>
                                    <Select
                                        value={
                                            formData.year_level?.toString() ||
                                            ""
                                        }
                                        onValueChange={(value) =>
                                            handleChange(
                                                "year_level",
                                                parseInt(value),
                                            )
                                        }
                                    >
                                        <SelectTrigger className="rounded-lg">
                                            <SelectValue placeholder="Select year level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yearLevels.map((year) => (
                                                <SelectItem
                                                    key={year}
                                                    value={year.toString()}
                                                >
                                                    Year {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="course_id">Course</Label>
                                    <Select
                                        value={
                                            formData.course_id?.toString() || ""
                                        }
                                        onValueChange={(value) =>
                                            handleChange(
                                                "course_id",
                                                parseInt(value),
                                            )
                                        }
                                    >
                                        <SelectTrigger className="rounded-lg">
                                            <SelectValue placeholder="Select course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses.map((course) => (
                                                <SelectItem
                                                    key={course.course_id}
                                                    value={course.course_id.toString()}
                                                >
                                                    {course.course_code} -{" "}
                                                    {course.course_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="section_id">Section</Label>
                                    <Select
                                        value={
                                            formData.section_id?.toString() ||
                                            ""
                                        }
                                        onValueChange={(value) =>
                                            handleChange(
                                                "section_id",
                                                parseInt(value),
                                            )
                                        }
                                    >
                                        <SelectTrigger className="rounded-lg">
                                            <SelectValue placeholder="Select section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredSections.length > 0 ? (
                                                filteredSections.map(
                                                    (section) => (
                                                        <SelectItem
                                                            key={
                                                                section.section_id
                                                            }
                                                            value={section.section_id.toString()}
                                                        >
                                                            {
                                                                section.section_code
                                                            }{" "}
                                                            -{" "}
                                                            {
                                                                section.section_name
                                                            }{" "}
                                                            (Year{" "}
                                                            {section.year_level}
                                                            )
                                                        </SelectItem>
                                                    ),
                                                )
                                            ) : (
                                                <SelectItem
                                                    value="no-sections"
                                                    disabled
                                                >
                                                    No sections available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Role Display (Read-only) */}
                        <div className="pt-4 border-t">
                            <div className="p-4 bg-blue-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">
                                            User Role
                                        </p>
                                        <p className="text-lg font-bold text-blue-700">
                                            COMELEC
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Can monitor elections, manage
                                            candidates, and oversee voting
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/admin/users")}
                                className="rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Create COMELEC User
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Information Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800">
                                About COMELEC Users
                            </h4>
                            <p className="text-sm text-blue-700 mt-1">
                                COMELEC users have access to the monitoring
                                dashboard and can manage candidates, view live
                                results, and oversee election operations. They
                                cannot create or delete elections or manage
                                system settings.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateUser;
