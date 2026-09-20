// resources/js/pages/Admin/UserList.tsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useUsers, useRefreshUsers } from "../hooks/useUsers";
import { RefreshButton } from "../components/common/RefreshButton";
import { adminAPI } from "../api/admin";
import {
    Users,
    Search,
    Loader2,
    UserPlus,
    Shield,
    Mail,
    GraduationCap,
    Trash2,
    Edit,
    AlertCircle,
    UserCheck,
} from "lucide-react";

interface User {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    student_id: string;
    course_id?: number;
    year_level?: number;
    role: string;
    is_active: boolean;
    course?: {
        course_id: number;
        course_code: string;
        course_name: string;
    };
    section?: {
        section_id: number;
        section_code: string;
        section_name: string;
        year_level: number;
    };
}

const UserList: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");

    const { data: users = [], isLoading, refetch, isFetching } = useUsers();

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const search = searchTerm.toLowerCase();
        return users.filter(
            (user: User) =>
                `${user.first_name} ${user.last_name}`.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search) ||
                user.student_id.toLowerCase().includes(search)
        );
    }, [users, searchTerm]);

    const handleDeleteUser = async (userId: number, userName: string) => {
        if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
            try {
                await adminAPI.deleteUser(userId);
                refetch();
            } catch (error: any) {
                alert(error.response?.data?.message || "Failed to delete user");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">COMELEC Users</h1>
                    <p className="text-gray-600">Manage COMELEC accounts</p>
                </div>
                <div className="flex space-x-2">
                    <RefreshButton onClick={() => refetch()} isLoading={isFetching} />
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate("/admin/users/create")}
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create COMELEC User
                    </Button>
                </div>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-600">{error}</span>
                    </CardContent>
                </Card>
            )}
            {/* ===== STATS - PILL/BADGE STYLE ===== */}
<div className="flex flex-wrap items-center gap-3 py-1">
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
        <Users className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-600">Total Users</span>
        <span className="text-sm font-bold text-gray-900">{users.length}</span>
    </div>
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
        <Shield className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-purple-700">COMELEC</span>
        <span className="text-sm font-bold text-purple-800">{users.filter(u => u.role === "comelec").length}</span>
    </div>
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
        <UserCheck className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-700">Active</span>
        <span className="text-sm font-bold text-blue-800">{users.filter(u => u.is_active).length}</span>
    </div>
</div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        COMELEC Users ({filteredUsers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search by name, email, or student ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 rounded-lg"
                        />
                    </div>

                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No COMELEC users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-left">Name</th>
                                        <th className="p-3 text-left">Email</th>
                                        <th className="p-3 text-left">Student ID</th>
                                        <th className="p-3 text-left">Course</th>
                                        <th className="p-3 text-left">Year</th>
                                        <th className="p-3 text-left">Status</th>
                                        <th className="p-3 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user: User) => (
                                        <tr key={user.user_id} className="border-t hover:bg-gray-50">
                                            <td className="p-3 font-medium">
                                                {user.first_name} {user.last_name}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono text-xs">
                                                {user.student_id}
                                            </td>
                                            <td className="p-3">
                                                {user.course?.course_code || "N/A"}
                                            </td>
                                            <td className="p-3">
                                                {user.year_level ? `Year ${user.year_level}` : "N/A"}
                                            </td>
                                            <td className="p-3">
                                                <Badge className="bg-green-100 text-green-800">
                                                    <UserCheck className="w-3 h-3 mr-1" />
                                                    Active
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDeleteUser(
                                                                user.user_id,
                                                                `${user.first_name} ${user.last_name}`
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UserList;