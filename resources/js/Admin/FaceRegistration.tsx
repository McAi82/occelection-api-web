// resources/js/pages/Admin/FaceRegistration.tsx
import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { adminAPI } from "../api/admin";
import {
    UserCheck,
    UserX,
    Loader2,
    RefreshCw,
    Users,
    Search,
    Filter,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { Input } from "../components/ui/input";

interface User {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    student_id: string;
    course: string | { course_code: string; course_name: string };
    role: string;
    face_reference_photo?: string;
    is_face_registered?: boolean;
    year_level?: number;
}

const FaceRegistration: React.FC = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [usersWithoutFace, setUsersWithoutFace] = useState<User[]>([]);
    const [usersWithFace, setUsersWithFace] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("pending");
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (): Promise<void> => {
        setLoading(true);
        setError("");
        try {
            const response = await adminAPI.getUsers();
            console.log("Users response:", response.data);

            let usersData: User[] = [];

            // ✅ Handle different response structures
            if (response.data?.data) {
                usersData = response.data.data;
            } else if (Array.isArray(response.data)) {
                usersData = response.data;
            } else if (response.data?.users) {
                usersData = response.data.users;
            } else if (response.data?.data?.data) {
                usersData = response.data.data.data;
            } else {
                usersData = [];
            }

            // ✅ Ensure is_face_registered is properly set
            usersData = usersData.map((user: User) => ({
                ...user,
                is_face_registered:
                    user.is_face_registered || !!user.face_reference_photo,
            }));

            setAllUsers(usersData);

            // ✅ Filter users
            const withFace = usersData.filter(
                (u: User) => u.is_face_registered === true,
            );
            const withoutFace = usersData.filter(
                (u: User) => u.is_face_registered !== true,
            );

            setUsersWithFace(withFace);
            setUsersWithoutFace(withoutFace);

            console.log(
                `✅ Loaded ${usersData.length} users (${withFace.length} with face, ${withoutFace.length} without)`,
            );
        } catch (error: any) {
            console.error("Failed to fetch users:", error);
            setError(
                error.response?.data?.message ||
                    "Failed to load users. Please refresh the page.",
            );
            setAllUsers([]);
            setUsersWithFace([]);
            setUsersWithoutFace([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async (): Promise<void> => {
        setRefreshing(true);
        await fetchUsers();
    };

    const getInitials = (firstName: string, lastName: string): string => {
        return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
    };

    const getCourseDisplay = (user: User): string => {
        if (!user.course) return "N/A";
        if (typeof user.course === "object") {
            return user.course.course_code || user.course.course_name || "N/A";
        }
        return user.course;
    };

    const getRoleBadgeColor = (role: string): string => {
        const colors: Record<string, string> = {
            admin: "bg-purple-100 text-purple-700",
            comel: "bg-blue-100 text-blue-700",
            candidate: "bg-green-100 text-green-700",
            voter: "bg-gray-100 text-gray-700",
        };
        return colors[role] || colors.voter;
    };

    // ✅ Filter users by search and role
    const getFilteredUsers = (users: User[]) => {
        let filtered = [...users];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (user) =>
                    user.first_name?.toLowerCase().includes(term) ||
                    user.last_name?.toLowerCase().includes(term) ||
                    user.email?.toLowerCase().includes(term) ||
                    user.student_id?.toLowerCase().includes(term),
            );
        }

        if (roleFilter !== "all") {
            filtered = filtered.filter((user) => user.role === roleFilter);
        }

        return filtered;
    };

    const filteredWithoutFace = getFilteredUsers(usersWithoutFace);
    const filteredWithFace = getFilteredUsers(usersWithFace);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <UserCheck className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Face Registration Status
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                Face Registration
                            </h1>
                            <p className="text-blue-100 mt-1">
                                View users who have registered their face for
                                mobile login
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                                <Users className="w-4 h-4 mr-1" />
                                {allUsers.length} Total Users
                            </Badge>
                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                                />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats - Pill/Badge Style */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Total Users
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {allUsers.length}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                    <UserX className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                        Not Registered
                    </span>
                    <span className="text-sm font-bold text-yellow-800">
                        {usersWithoutFace.length}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        Registered
                    </span>
                    <span className="text-sm font-bold text-green-800">
                        {usersWithFace.length}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                    <span className="text-sm font-medium text-blue-700">
                        Registration Rate
                    </span>
                    <span className="text-sm font-bold text-blue-800">
                        {allUsers.length > 0
                            ? Math.round(
                                  (usersWithFace.length / allUsers.length) *
                                      100,
                              )
                            : 0}
                        %
                    </span>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Search & Filter */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-600" />
                        Search & Filter Users
                    </CardTitle>
                </div>
                <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search by name, email, or student ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 rounded-xl bg-gray-50 border-gray-200"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="all">All Roles</option>
                                <option value="voter">Voter</option>
                                <option value="candidate">Candidate</option>
                                <option value="comelec">COMELEC</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
            >
                <TabsList className="bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger
                        value="pending"
                        className="rounded-lg data-[state=active]:bg-yellow-500 data-[state=active]:text-white"
                    >
                        <UserX className="w-4 h-4 mr-2" />
                        Not Registered ({filteredWithoutFace.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="registered"
                        className="rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white"
                    >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Registered ({filteredWithFace.length})
                    </TabsTrigger>
                </TabsList>

                {/* NOT REGISTERED TAB */}
                <TabsContent value="pending" className="space-y-4">
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <UserX className="w-5 h-5 text-yellow-600" />
                                Users Not Registered (
                                {filteredWithoutFace.length})
                            </CardTitle>
                        </div>
                        <CardContent className="p-5">
                            {filteredWithoutFace.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredWithoutFace.map((user) => (
                                        <div
                                            key={user.user_id}
                                            className="border border-gray-200 rounded-xl p-4 hover:border-yellow-300 hover:bg-yellow-50/30 transition-all"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="w-12 h-12">
                                                    <AvatarFallback className="bg-gray-400 text-white text-base font-bold">
                                                        {getInitials(
                                                            user.first_name,
                                                            user.last_name,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                        {user.first_name}{" "}
                                                        {user.last_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {user.email}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {user.student_id} •{" "}
                                                        {getCourseDisplay(user)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            className={`text-xs ${getRoleBadgeColor(user.role)}`}
                                                        >
                                                            {user.role?.toUpperCase()}
                                                        </Badge>
                                                        {user.year_level && (
                                                            <span className="text-xs text-gray-400">
                                                                Year{" "}
                                                                {
                                                                    user.year_level
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge className="bg-yellow-100 text-yellow-700 border-0 flex-shrink-0">
                                                    <UserX className="w-3 h-3 mr-1" />
                                                    Pending
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                                    <p className="font-medium text-green-600">
                                        All users are registered!
                                    </p>
                                    <p className="text-sm mt-1">
                                        {allUsers.length} users have face
                                        registration
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* REGISTERED TAB */}
                <TabsContent value="registered" className="space-y-4">
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-green-600" />
                                Registered Users ({filteredWithFace.length})
                            </CardTitle>
                        </div>
                        <CardContent className="p-5">
                            {filteredWithFace.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredWithFace.map((user) => (
                                        <div
                                            key={user.user_id}
                                            className="border border-gray-200 rounded-xl p-4 bg-green-50/30 hover:bg-green-50 transition-all"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="w-12 h-12 ring-2 ring-green-300">
                                                    {user.face_reference_photo ? (
                                                        <AvatarImage
                                                            src={
                                                                user.face_reference_photo
                                                            }
                                                        />
                                                    ) : null}
                                                    <AvatarFallback className="bg-green-500 text-white text-base font-bold">
                                                        {getInitials(
                                                            user.first_name,
                                                            user.last_name,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                        {user.first_name}{" "}
                                                        {user.last_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {user.email}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {user.student_id} •{" "}
                                                        {getCourseDisplay(user)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            className={`text-xs ${getRoleBadgeColor(user.role)}`}
                                                        >
                                                            {user.role?.toUpperCase()}
                                                        </Badge>
                                                        {user.year_level && (
                                                            <span className="text-xs text-gray-400">
                                                                Year{" "}
                                                                {
                                                                    user.year_level
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge className="bg-green-100 text-green-700 border-0 flex-shrink-0">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Registered
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">
                                        No registered faces yet
                                    </p>
                                    <p className="text-sm mt-1">
                                        Users will appear here once they
                                        register their face
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

           
        </div>
    );
};

export default FaceRegistration;
