// resources/js/pages/Admin/ManageCandidates.tsx
import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { candidateAPI } from "../api/candidates";
import { electionAPI } from "../api/elections";
import { adminAPI } from "../api/admin";
import { courseAPI } from "../api/courses";
import { comelecAPI } from "../api/comelec";
import {
    CheckCircle,
    Users,
    Loader2,
    RefreshCw,
    Trash2,
    UserPlus,
    Search,
    Award,
    XCircle,
    School,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
    election_type: string;
}

interface Position {
    position_id: number;
    title: string;
    category?: string;
}

interface Course {
    course_id: number;
    course_code: string;
    course_name: string;
}

interface User {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    student_id: string;
    course_id?: number;
    year_level: number;
    role: string;
    face_reference_photo?: string;
    course?: Course;
}

interface Candidate {
    candidate_id: number;
    user_id: number;
    position_id: number;
    is_approved: boolean;
    user?: {
        user_id: number;
        first_name: string;
        last_name: string;
        email: string;
        student_id: string;
        course_id?: number;
        year_level: number;
        role: string;
        face_reference_photo?: string;
        course?: Course;
    };
    position?: {
        position_id: number;
        title: string;
        category?: string;
    };
}

interface UserSelection {
    position_id: string;
}

interface ToastMessage {
    type: "success" | "error";
    title: string;
    message: string;
}

const ManageCandidates: React.FC = () => {
    const [elections, setElections] = useState<Election[]>([]);
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [positions, setPositions] = useState<Position[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [removingCandidateId, setRemovingCandidateId] = useState<
        number | null
    >(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [courseFilter, setCourseFilter] = useState<string>("all");
    const [courses, setCourses] = useState<Course[]>([]);
    const [userSelections, setUserSelections] = useState<
        Record<number, UserSelection>
    >({});
    const [toast, setToast] = useState<ToastMessage | null>(null);

    useEffect(() => {
        fetchElections();
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedElection) {
            fetchElectionDetails();
            fetchCandidates();
            fetchUsers();
        }
    }, [selectedElection]);

    useEffect(() => {
        filterUsers();
    }, [searchTerm, courseFilter, users]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (
        type: "success" | "error",
        title: string,
        message: string,
    ) => {
        setToast({ type, title, message });
    };

    const fetchElections = async () => {
        try {
            const response = await electionAPI.getAll();
            setElections(Array.isArray(response.data) ? response.data : []);
            if (response.data?.length > 0) {
                setSelectedElection(response.data[0].election_id.toString());
            }
        } catch (error) {
            console.error("Failed to fetch elections:", error);
            showToast("error", "Error", "Failed to load elections");
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await courseAPI.getAll();
            setCourses(response.data || []);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        }
    };

    const fetchElectionDetails = async () => {
        if (!selectedElection) return;
        try {
            const response = await electionAPI.getById(selectedElection);
            setPositions(response.data?.positions || []);
        } catch (error) {
            console.error("Failed to fetch election details:", error);
        }
    };

    const fetchCandidates = async () => {
        if (!selectedElection) return;
        setLoading(true);
        try {
            const response = await candidateAPI.getByElection(selectedElection);
            const candidatesData = Array.isArray(response.data)
                ? response.data
                : [];
            setCandidates(candidatesData);
        } catch (error) {
            console.error("Failed to fetch candidates:", error);
            showToast("error", "Error", "Failed to load candidates");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        if (!selectedElection) return;
        try {
            const response = await comelecAPI.getUsers();
            const allUsers = Array.isArray(response.data) ? response.data : [];
            const eligibleUsers = allUsers.filter(
                (user: User) =>
                    user.role === "voter" &&
                    !candidates.some((c) => c.user_id === user.user_id),
            );
            setUsers(eligibleUsers);
            setFilteredUsers(eligibleUsers);
            const initialSelections: Record<number, UserSelection> = {};
            eligibleUsers.forEach((user: User) => {
                initialSelections[user.user_id] = { position_id: "" };
            });
            setUserSelections(initialSelections);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    const filterUsers = () => {
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
        if (courseFilter !== "all") {
            filtered = filtered.filter(
                (user) => user.course?.course_code === courseFilter,
            );
        }
        setFilteredUsers(filtered);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchCandidates(), fetchUsers()]);
        setRefreshing(false);
        showToast("success", "Refreshed", "Data has been refreshed");
    };

    const handleAddCandidates = async () => {
        const candidatesToAdd = selectedUsers.filter(
            (user) => userSelections[user.user_id]?.position_id,
        );

        if (candidatesToAdd.length === 0) {
            showToast(
                "error",
                "Validation Error",
                "Please select at least one user with a position assigned",
            );
            return;
        }

        setLoading(true);

        const candidatesData = candidatesToAdd.map((user) => ({
            user_id: user.user_id,
            position_id: parseInt(userSelections[user.user_id].position_id),
        }));

        try {
            const response = await adminAPI.addBulkCandidates({
                election_id: parseInt(selectedElection),
                candidates: candidatesData,
            });

            const resultData = response.data;
            if (resultData?.success_count > 0) {
                const successMessage = `Successfully added ${resultData.success_count} candidate(s)`;
                if (resultData.fail_count > 0) {
                    showToast(
                        "success",
                        "Candidates Added",
                        `${successMessage}, ${resultData.fail_count} failed`,
                    );
                } else {
                    showToast("success", "Candidates Added", successMessage);
                }
                setIsAddDialogOpen(false);
                resetForm();
                await fetchCandidates();
                await fetchUsers();
            } else {
                showToast("error", "Add Failed", "Failed to add candidates");
            }
        } catch (error: any) {
            console.error("Failed to add candidates:", error);
            showToast(
                "error",
                "Add Failed",
                error.response?.data?.message || "Failed to add candidates",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCandidate = async (
        candidateId: number,
        candidateName: string,
    ) => {
        if (
            window.confirm(
                `Are you sure you want to remove ${candidateName} as a candidate?`,
            )
        ) {
            setRemovingCandidateId(candidateId);
            try {
                await adminAPI.removeCandidate(candidateId);
                showToast(
                    "success",
                    "Candidate Removed",
                    `${candidateName} has been removed successfully`,
                );
                await fetchCandidates();
                await fetchUsers();
            } catch (error: any) {
                console.error("Failed to remove candidate:", error);
                showToast(
                    "error",
                    "Remove Failed",
                    error.response?.data?.message ||
                        "Failed to remove candidate",
                );
            } finally {
                setRemovingCandidateId(null);
            }
        }
    };

    const resetForm = () => {
        setSelectedUsers([]);
        setSearchTerm("");
        setCourseFilter("all");
        setUserSelections({});
    };

    const toggleUserSelection = (user: User) => {
        setSelectedUsers((prev) =>
            prev.find((u) => u.user_id === user.user_id)
                ? prev.filter((u) => u.user_id !== user.user_id)
                : [...prev, user],
        );
    };

    const toggleSelectAll = () => {
        if (
            selectedUsers.length === filteredUsers.length &&
            filteredUsers.length > 0
        ) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers([...filteredUsers]);
        }
    };

    const updateUserSelection = (
        userId: number,
        field: keyof UserSelection,
        value: string,
    ) => {
        setUserSelections((prev) => ({
            ...prev,
            [userId]: { ...prev[userId], [field]: value },
        }));
    };

    const getImageUrl = (path?: string) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `https://occelection-api-web-production.up.railway.app/${path}`;
    };

    const candidatesByPosition = candidates.reduce(
        (acc, candidate) => {
            const positionTitle = candidate.position?.title || "Other";
            if (!acc[positionTitle]) acc[positionTitle] = [];
            acc[positionTitle].push(candidate);
            return acc;
        },
        {} as Record<string, Candidate[]>,
    );

    if (loading && !candidates.length) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {toast && (
                <div
                    className={`fixed top-20 right-4 z-50 max-w-md animate-in slide-in-from-right-5 duration-300`}
                >
                    <div
                        className={`rounded-lg border p-4 shadow-lg ${toast.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                    >
                        <div className="flex items-start gap-3">
                            {toast.type === "success" ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <div className="flex-1">
                                <h4
                                    className={`font-semibold ${toast.type === "success" ? "text-green-800" : "text-red-800"}`}
                                >
                                    {toast.title}
                                </h4>
                                <p
                                    className={`text-sm mt-1 ${toast.type === "success" ? "text-green-800" : "text-red-800"}`}
                                >
                                    {toast.message}
                                </p>
                            </div>
                            <button
                                onClick={() => setToast(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Manage Candidates
                    </h1>
                    <p className="text-gray-600">
                        View and manage candidates for each election
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </Button>
                    {/* <Button className="bg-blue-600" onClick={() => setIsAddDialogOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" /> Add Candidates
                    </Button> */}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Election</CardTitle>
                </CardHeader>
                <CardContent>
                    <select
                        className="w-full md:w-64 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedElection}
                        onChange={(e) => setSelectedElection(e.target.value)}
                    >
                        {elections.map((election) => (
                            <option
                                key={election.election_id}
                                value={election.election_id}
                            >
                                {election.title} ({election.election_type})
                            </option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {/* ===== STATS - PILL/BADGE STYLE ===== */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Total Candidates
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {candidates.length}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                        Positions
                    </span>
                    <span className="text-sm font-bold text-purple-800">
                        {positions.length}
                    </span>
                </div>
            </div>

            {Object.keys(candidatesByPosition).length > 0 ? (
                <Tabs
                    defaultValue={Object.keys(candidatesByPosition)[0]}
                    className="space-y-4"
                >
                    <TabsList className="flex flex-wrap h-auto">
                        {Object.keys(candidatesByPosition).map((position) => (
                            <TabsTrigger key={position} value={position}>
                                {position} (
                                {candidatesByPosition[position].length})
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {Object.entries(candidatesByPosition).map(
                        ([position, positionCandidates]) => (
                            <TabsContent key={position} value={position}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Award className="w-5 h-5 mr-2 text-blue-600" />
                                            {position}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {positionCandidates.map(
                                                (candidate) => (
                                                    <div
                                                        key={
                                                            candidate.candidate_id
                                                        }
                                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                                    >
                                                        <div className="flex items-center space-x-4">
                                                            <Avatar className="w-12 h-12">
                                                                <AvatarImage
                                                                    src={
                                                                        getImageUrl(
                                                                            candidate
                                                                                .user
                                                                                ?.face_reference_photo,
                                                                        ) || ""
                                                                    }
                                                                />
                                                                <AvatarFallback className="bg-blue-500 text-white">
                                                                    {
                                                                        candidate
                                                                            .user
                                                                            ?.first_name?.[0]
                                                                    }
                                                                    {
                                                                        candidate
                                                                            .user
                                                                            ?.last_name?.[0]
                                                                    }
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <h3 className="font-semibold">
                                                                    {
                                                                        candidate
                                                                            .user
                                                                            ?.first_name
                                                                    }{" "}
                                                                    {
                                                                        candidate
                                                                            .user
                                                                            ?.last_name
                                                                    }
                                                                </h3>
                                                                <p className="text-sm text-gray-600">
                                                                    {candidate
                                                                        .user
                                                                        ?.course
                                                                        ?.course_code ||
                                                                        "N/A"}{" "}
                                                                    - Year{" "}
                                                                    {
                                                                        candidate
                                                                            .user
                                                                            ?.year_level
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Student ID:{" "}
                                                                    {
                                                                        candidate
                                                                            .user
                                                                            ?.student_id
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleRemoveCandidate(
                                                                    candidate.candidate_id,
                                                                    `${candidate.user?.first_name} ${candidate.user?.last_name}`,
                                                                )
                                                            }
                                                            disabled={
                                                                removingCandidateId ===
                                                                candidate.candidate_id
                                                            }
                                                        >
                                                            {removingCandidateId ===
                                                            candidate.candidate_id ? (
                                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4 mr-1" />
                                                            )}
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ),
                    )}
                </Tabs>
            ) : (
                <Card>
                    <CardContent className="text-center py-12">
                        <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500">No candidates added yet</p>
                        <Button
                            variant="link"
                            onClick={() => setIsAddDialogOpen(true)}
                            className="mt-2"
                        >
                            Add your first candidates
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Add Candidates Dialog - no partylist */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Candidates to Election</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Select Users and Assign Positions</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleSelectAll}
                            >
                                {selectedUsers.length ===
                                    filteredUsers.length &&
                                filteredUsers.length > 0
                                    ? "Deselect All"
                                    : "Select All"}
                            </Button>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    className="w-full pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                    value={courseFilter}
                                    onChange={(e) =>
                                        setCourseFilter(e.target.value)
                                    }
                                >
                                    <option value="all">All Courses</option>
                                    {courses.map((course) => (
                                        <option
                                            key={course.course_id}
                                            value={course.course_code}
                                        >
                                            {course.course_code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-800">
                                Selected: {selectedUsers.length} user(s)
                            </p>
                        </div>
                        <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-left w-12">
                                            <Checkbox
                                                checked={
                                                    selectedUsers.length ===
                                                        filteredUsers.length &&
                                                    filteredUsers.length > 0
                                                }
                                                onCheckedChange={
                                                    toggleSelectAll
                                                }
                                            />
                                        </th>
                                        <th className="p-3 text-left">User</th>
                                        <th className="p-3 text-left">
                                            Course
                                        </th>
                                        <th className="p-3 text-left">Year</th>
                                        <th className="p-3 text-left">
                                            Position *
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => {
                                        const isSelected = selectedUsers.some(
                                            (u) => u.user_id === user.user_id,
                                        );
                                        return (
                                            <tr
                                                key={user.user_id}
                                                className="border-t hover:bg-gray-50"
                                            >
                                                <td className="p-3">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() =>
                                                            toggleUserSelection(
                                                                user,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                                                                {
                                                                    user
                                                                        .first_name?.[0]
                                                                }
                                                                {
                                                                    user
                                                                        .last_name?.[0]
                                                                }
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">
                                                                {
                                                                    user.first_name
                                                                }{" "}
                                                                {user.last_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {user.email}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {
                                                                    user.student_id
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {user.course?.course_code ||
                                                        "N/A"}
                                                </td>
                                                <td className="p-3">
                                                    Year {user.year_level}
                                                </td>
                                                <td className="p-3">
                                                    <Select
                                                        value={
                                                            userSelections[
                                                                user.user_id
                                                            ]?.position_id || ""
                                                        }
                                                        onValueChange={(val) =>
                                                            updateUserSelection(
                                                                user.user_id,
                                                                "position_id",
                                                                val,
                                                            )
                                                        }
                                                        disabled={!isSelected}
                                                    >
                                                        <SelectTrigger className="w-48">
                                                            <SelectValue placeholder="Select position" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {positions.map(
                                                                (position) => (
                                                                    <SelectItem
                                                                        key={
                                                                            position.position_id
                                                                        }
                                                                        value={position.position_id.toString()}
                                                                    >
                                                                        {
                                                                            position.title
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="p-8 text-center text-gray-500"
                                            >
                                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No eligible users found</p>
                                                {courseFilter !== "all" && (
                                                    <Button
                                                        variant="link"
                                                        onClick={() =>
                                                            setCourseFilter(
                                                                "all",
                                                            )
                                                        }
                                                        className="mt-2"
                                                    >
                                                        Clear course filter
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddCandidates}
                                disabled={loading}
                                className="bg-blue-600"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <UserPlus className="w-4 h-4 mr-2" />
                                )}
                                Add Selected Candidates
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManageCandidates;
