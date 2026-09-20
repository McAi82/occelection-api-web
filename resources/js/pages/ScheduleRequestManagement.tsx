// resources/js/pages/Schedule/ScheduleRequestManagement.tsx
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
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
import { campaignScheduleRequestAPI } from "../api/campaignScheduleRequest";
import { useElections } from "../hooks/useElections";
import { useAuth } from "../contexts/AuthContext";
import { RefreshButton } from "../components/common/RefreshButton";
import {
    Calendar,
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    User,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    FileText,
    UserCheck,
    UserX,
    Hourglass,
    CalendarCheck,
} from "lucide-react";

interface ScheduleRequest {
    request_id: number;
    candidate_id: number;
    election_id: number;
    section_id: number;
    preferred_date: string;
    preferred_start_time: string;
    preferred_end_time: string;
    message: string | null;
    status: "pending" | "approved" | "rejected" | "rescheduled";
    admin_remarks: string | null;
    processed_by_user_id: number | null;
    processed_at: string | null;
    created_at: string;
    candidate: {
        candidate_id: number;
        user: {
            user_id: number;
            first_name: string;
            last_name: string;
            email: string;
            student_id: string;
        };
        position: {
            position_id: number;
            title: string;
        };
    };
    section: {
        section_id: number;
        section_code: string;
        section_name: string;
        year_level: number;
        course: {
            course_id: number;
            course_code: string;
            course_name: string;
        };
    };
    election: {
        election_id: number;
        title: string;
        election_type: string;
    };
    processed_by?: {
        user_id: number;
        first_name: string;
        last_name: string;
    };
}

const ScheduleRequestManagement: React.FC<{
    userRole: "admin" | "comelec";
}> = ({ userRole }) => {
    const { user } = useAuth();
    const { data: elections = [], isLoading: electionsLoading } =
        useElections();
    const [requests, setRequests] = useState<ScheduleRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<ScheduleRequest[]>(
        [],
    );
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedElection, setSelectedElection] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("pending");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRequest, setSelectedRequest] =
        useState<ScheduleRequest | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [remarks, setRemarks] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);

    // Reschedule state
    const [showReschedule, setShowReschedule] = useState(false);
    const [rescheduleData, setRescheduleData] = useState({
        new_date: "",
        new_start_time: "",
        new_end_time: "",
    });

    useEffect(() => {
        fetchRequests();
    }, [selectedElection, selectedStatus]);

    useEffect(() => {
        filterRequests();
    }, [requests, searchTerm]);

    const fetchRequests = async () => {
        setLoading(true);
        setError("");
        try {
            const params: any = {};
            if (selectedElection !== "all")
                params.election_id = parseInt(selectedElection);
            if (selectedStatus !== "all") params.status = selectedStatus;

            const requestsData = await campaignScheduleRequestAPI.getRequests(
                params,
                userRole,
            );
            console.log("Schedule requests fetched:", requestsData);

            setRequests(requestsData || []);
            setFilteredRequests(requestsData || []);
        } catch (error: any) {
            console.error("Failed to fetch requests:", error);
            setError(
                error.response?.data?.message ||
                    "Failed to load schedule requests",
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterRequests = () => {
        if (!searchTerm.trim()) {
            setFilteredRequests(requests);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = requests.filter(
            (request) =>
                request.candidate.user.first_name
                    .toLowerCase()
                    .includes(term) ||
                request.candidate.user.last_name.toLowerCase().includes(term) ||
                request.candidate.user.student_id
                    .toLowerCase()
                    .includes(term) ||
                request.section?.course?.course_code
                    ?.toLowerCase()
                    .includes(term),
        );
        setFilteredRequests(filtered);
    };

    const handleProcessRequest = async (
        action: "approve" | "reject" | "reschedule",
    ) => {
        if (!selectedRequest) return;
        setActionLoading(true);
        setError("");
        setSuccess("");

        try {
            let data: any = {
                action,
                admin_remarks: remarks || undefined,
            };

            if (action === "reschedule") {
                if (
                    !rescheduleData.new_date ||
                    !rescheduleData.new_start_time ||
                    !rescheduleData.new_end_time
                ) {
                    setError("Please fill in all reschedule fields");
                    setActionLoading(false);
                    return;
                }
                data.new_date = rescheduleData.new_date;
                data.new_start_time = rescheduleData.new_start_time;
                data.new_end_time = rescheduleData.new_end_time;
            }

            await campaignScheduleRequestAPI.processRequest(
                selectedRequest.request_id,
                data,
                userRole,
            );

            const actionMessages = {
                approve: "Schedule request approved successfully!",
                reject: "Schedule request rejected.",
                reschedule: "Schedule request rescheduled successfully!",
            };

            setSuccess(actionMessages[action]);
            setTimeout(() => setSuccess(""), 3000);

            setDialogOpen(false);
            setShowReschedule(false);
            setRemarks("");
            setRescheduleData({
                new_date: "",
                new_start_time: "",
                new_end_time: "",
            });
            fetchRequests();
        } catch (error: any) {
            setError(
                error.response?.data?.message || "Failed to process request",
            );
        } finally {
            setActionLoading(false);
        }
    };

    const openRequestDialog = (request: ScheduleRequest) => {
        setSelectedRequest(request);
        setRemarks("");
        setShowReschedule(false);
        setRescheduleData({
            new_date: "",
            new_start_time: "",
            new_end_time: "",
        });
        setDialogOpen(true);
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; color: string }> = {
            pending: {
                label: "Pending",
                color: "bg-yellow-100 text-yellow-800",
            },
            approved: {
                label: "Approved ✅",
                color: "bg-green-100 text-green-800",
            },
            rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
            rescheduled: {
                label: "Rescheduled",
                color: "bg-blue-100 text-blue-800",
            },
        };
        return config[status] || config.pending;
    };

    const getStatusCounts = () => {
        const counts = {
            total: requests.length,
            pending: requests.filter((r) => r.status === "pending").length,
            approved: requests.filter((r) => r.status === "approved").length,
            rejected: requests.filter((r) => r.status === "rejected").length,
            rescheduled: requests.filter((r) => r.status === "rescheduled")
                .length,
        };
        return counts;
    };

    const counts = getStatusCounts();

    // Pagination
    const totalPages = Math.ceil(filteredRequests.length / perPage);
    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage,
    );

    if (loading && !requests.length) {
        return (
            <div className="flex justify-center py-12">
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
                                <Calendar className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Schedule Requests
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                Campaign Schedule Requests
                            </h1>
                            <p className="text-blue-100 mt-1">
                                Review and manage campaign schedule requests
                                from candidates
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                                <FileText className="w-4 h-4 mr-1" />
                                {counts.total} Total Requests
                            </Badge>
                            <RefreshButton
                                onClick={fetchRequests}
                                isLoading={refreshing}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ Stats - Pill/Badge Style */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Total
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {counts.total}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                    <Hourglass className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                        Pending
                    </span>
                    <span className="text-sm font-bold text-yellow-800">
                        {counts.pending}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        Approved
                    </span>
                    <span className="text-sm font-bold text-green-800">
                        {counts.approved}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                    <UserX className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                        Rejected
                    </span>
                    <span className="text-sm font-bold text-red-800">
                        {counts.rejected}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                    <CalendarCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                        Rescheduled
                    </span>
                    <span className="text-sm font-bold text-blue-800">
                        {counts.rescheduled}
                    </span>
                </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert className="bg-green-50 border-green-200 rounded-xl">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">
                        {success}
                    </AlertDescription>
                </Alert>
            )}

            {/* Filters */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        Filters
                    </CardTitle>
                </div>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label className="text-sm font-semibold">
                                Election
                            </Label>
                            <Select
                                value={selectedElection}
                                onValueChange={(value) => {
                                    setSelectedElection(value);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="rounded-xl mt-1.5">
                                    <SelectValue placeholder="All Elections" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Elections
                                    </SelectItem>
                                    {elections.map((election: any) => (
                                        <SelectItem
                                            key={election.election_id}
                                            value={election.election_id.toString()}
                                        >
                                            {election.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold">
                                Status
                            </Label>
                            <Select
                                value={selectedStatus}
                                onValueChange={(value) => {
                                    setSelectedStatus(value);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="rounded-xl mt-1.5">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Status
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="approved">
                                        Approved
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                        Rejected
                                    </SelectItem>
                                    <SelectItem value="rescheduled">
                                        Rescheduled
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold">
                                Search
                            </Label>
                            <div className="relative mt-1.5">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search by name or student ID..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="pl-10 rounded-xl bg-gray-50 border-gray-200"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Requests Table */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Requests ({filteredRequests.length})
                        </span>
                        <span className="text-sm font-normal text-gray-500">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredRequests.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">
                                No schedule requests found
                            </p>
                            <p className="text-sm mt-1">
                                Try adjusting your filters
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-4 text-left font-semibold text-gray-700">
                                                Candidate
                                            </th>
                                            <th className="p-4 text-left font-semibold text-gray-700">
                                                Position
                                            </th>
                                            <th className="p-4 text-left font-semibold text-gray-700">
                                                Section
                                            </th>
                                            <th className="p-4 text-left font-semibold text-gray-700">
                                                Preferred Date
                                            </th>
                                            <th className="p-4 text-left font-semibold text-gray-700">
                                                Time
                                            </th>
                                            <th className="p-4 text-left font-semibold text-gray-700">
                                                Status
                                            </th>
                                            <th className="p-4 text-left font-semibold text-gray-700">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedRequests.map((request) => {
                                            const status = getStatusBadge(
                                                request.status,
                                            );
                                            return (
                                                <tr
                                                    key={request.request_id}
                                                    className="border-t hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="p-4">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">
                                                                {
                                                                    request
                                                                        .candidate
                                                                        .user
                                                                        .first_name
                                                                }{" "}
                                                                {
                                                                    request
                                                                        .candidate
                                                                        .user
                                                                        .last_name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {
                                                                    request
                                                                        .candidate
                                                                        .user
                                                                        .student_id
                                                                }
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {request.candidate
                                                                .position
                                                                ?.title ||
                                                                "N/A"}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {request.section
                                                                ?.course
                                                                ?.course_code ||
                                                                "N/A"}{" "}
                                                            - Year{" "}
                                                            {request.section
                                                                ?.year_level ||
                                                                "N/A"}{" "}
                                                            Section{" "}
                                                            {request.section
                                                                ?.section_code ||
                                                                "N/A"}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm text-gray-600">
                                                            {new Date(
                                                                request.preferred_date,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm text-gray-600">
                                                            {
                                                                request.preferred_start_time
                                                            }{" "}
                                                            -{" "}
                                                            {
                                                                request.preferred_end_time
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge
                                                            className={
                                                                status.color
                                                            }
                                                        >
                                                            {status.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        {request.status ===
                                                        "pending" ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    openRequestDialog(
                                                                        request,
                                                                    )
                                                                }
                                                                className="text-blue-600 hover:text-blue-700 rounded-xl"
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                Review
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    openRequestDialog(
                                                                        request,
                                                                    )
                                                                }
                                                                className="text-gray-500 hover:text-gray-700"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="rounded-xl"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                    <span className="text-sm text-gray-500">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1),
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        className="rounded-xl"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Review Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Review Schedule Request
                        </DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4">
                            {/* Request Details */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Candidate
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {
                                            selectedRequest.candidate.user
                                                .first_name
                                        }{" "}
                                        {
                                            selectedRequest.candidate.user
                                                .last_name
                                        }
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {
                                            selectedRequest.candidate.user
                                                .student_id
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Position
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {selectedRequest.candidate.position
                                            ?.title || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Section
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {selectedRequest.section?.course
                                            ?.course_code || "N/A"}{" "}
                                        - Year{" "}
                                        {selectedRequest.section?.year_level ||
                                            "N/A"}{" "}
                                        Section{" "}
                                        {selectedRequest.section
                                            ?.section_code || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Election
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {selectedRequest.election.title}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Preferred Date
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(
                                            selectedRequest.preferred_date,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Time
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {selectedRequest.preferred_start_time} -{" "}
                                        {selectedRequest.preferred_end_time}
                                    </p>
                                </div>
                            </div>

                            {selectedRequest.message && (
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Message from Candidate
                                    </p>
                                    <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                                        {selectedRequest.message}
                                    </p>
                                </div>
                            )}

                            {/* Reschedule Form */}
                            {showReschedule && (
                                <div className="p-4 border rounded-xl">
                                    <h4 className="font-semibold mb-3 text-gray-900">
                                        Reschedule Details
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-sm font-semibold">
                                                New Date *
                                            </Label>
                                            <Input
                                                type="date"
                                                value={rescheduleData.new_date}
                                                onChange={(e) =>
                                                    setRescheduleData({
                                                        ...rescheduleData,
                                                        new_date:
                                                            e.target.value,
                                                    })
                                                }
                                                min={
                                                    new Date()
                                                        .toISOString()
                                                        .split("T")[0]
                                                }
                                                className="rounded-xl mt-1.5"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-semibold">
                                                    New Start Time *
                                                </Label>
                                                <Input
                                                    type="time"
                                                    value={
                                                        rescheduleData.new_start_time
                                                    }
                                                    onChange={(e) =>
                                                        setRescheduleData({
                                                            ...rescheduleData,
                                                            new_start_time:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="rounded-xl mt-1.5"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-semibold">
                                                    New End Time *
                                                </Label>
                                                <Input
                                                    type="time"
                                                    value={
                                                        rescheduleData.new_end_time
                                                    }
                                                    onChange={(e) =>
                                                        setRescheduleData({
                                                            ...rescheduleData,
                                                            new_end_time:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="rounded-xl mt-1.5"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Admin Remarks */}
                            <div>
                                <Label className="text-sm font-semibold">
                                    Remarks (Optional)
                                </Label>
                                <Textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add remarks for the candidate..."
                                    rows={2}
                                    className="rounded-xl mt-1.5"
                                />
                            </div>

                            {/* Action Buttons */}
                            {selectedRequest.status === "pending" && (
                                <div className="flex flex-wrap gap-2 justify-end pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setShowReschedule(!showReschedule)
                                        }
                                        className="rounded-xl"
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Reschedule
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            handleProcessRequest("reject")
                                        }
                                        disabled={actionLoading}
                                        className="rounded-xl"
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <XCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Reject
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
                                        onClick={() =>
                                            handleProcessRequest("approve")
                                        }
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Approve
                                    </Button>
                                </div>
                            )}

                            {selectedRequest.status !== "pending" && (
                                <div className="pt-4 border-t">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <User className="w-4 h-4" />
                                        <span>
                                            Processed by:{" "}
                                            {selectedRequest.processed_by
                                                ?.first_name || "Unknown"}{" "}
                                            {selectedRequest.processed_by
                                                ?.last_name || ""}
                                        </span>
                                        <span className="mx-2">•</span>
                                        <span>
                                            {selectedRequest.processed_at
                                                ? new Date(
                                                      selectedRequest.processed_at,
                                                  ).toLocaleDateString()
                                                : "N/A"}
                                        </span>
                                    </div>
                                    {selectedRequest.admin_remarks && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            Remarks:{" "}
                                            {selectedRequest.admin_remarks}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Info Section */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800">
                                About Schedule Requests
                            </h4>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>
                                    • Candidates submit schedule requests for
                                    their campaign periods
                                </li>
                                <li>
                                    • Each request must be reviewed and approved
                                    by COMELEC/Admin
                                </li>
                                <li>
                                    • Approved requests are automatically added
                                    to the campaign schedule
                                </li>
                                <li>
                                    • Requests can be rescheduled if the
                                    proposed time is not available
                                </li>
                                <li>
                                    • Only pending requests can be processed
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ScheduleRequestManagement;
