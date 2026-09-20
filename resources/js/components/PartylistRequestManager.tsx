// resources/js/pages/Candidates/PartylistRequestManager.tsx
import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { partylistAPI } from "../api/partylists";
import {
    Building2,
    Users,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    Clock,
    UserCheck,
    UserX,
    Search,
    Mail,
    GraduationCap,
    Shield,
    Filter,
} from "lucide-react";
import { Input } from "../components/ui/input";

interface MembershipRequest {
    membership_id: number;
    candidate_id: number;
    partylist_id: number;
    status: "pending" | "approved" | "rejected";
    created_at: string;
    candidate?: {
        candidate_id: number;
        user: {
            user_id: number;
            first_name: string;
            last_name: string;
            email: string;
            student_id: string;
            face_reference_photo?: string;
            course?: { course_code: string; course_name: string };
            year_level?: number;
        };
        position?: {
            position_id: number;
            title: string;
        };
    };
    partylist?: {
        partylist_id: number;
        name: string;
    };
}

const PartylistRequestManager: React.FC = () => {
    const [requests, setRequests] = useState<MembershipRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<
        MembershipRequest[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("pending");
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    useEffect(() => {
        filterRequests();
    }, [requests, searchTerm]);

    const fetchRequests = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await partylistAPI.getMembershipRequests({
                status: statusFilter !== "all" ? statusFilter : undefined,
            });
            const data = response.data?.data || response.data || [];
            setRequests(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error("Failed to fetch requests:", err);
            setError(
                err.response?.data?.message ||
                    "Failed to load membership requests",
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
        const filtered = requests.filter((req) => {
            const user = req.candidate?.user;
            return (
                user?.first_name?.toLowerCase().includes(term) ||
                user?.last_name?.toLowerCase().includes(term) ||
                user?.student_id?.toLowerCase().includes(term) ||
                req.partylist?.name?.toLowerCase().includes(term)
            );
        });
        setFilteredRequests(filtered);
    };

    const handleProcess = async (
        membershipId: number,
        action: "approve" | "reject",
    ) => {
        setActionLoading(membershipId);
        setError("");
        setSuccess("");

        try {
            if (action === "approve") {
                await partylistAPI.approveMembership(membershipId);
                setSuccess("Membership request approved successfully!");
            } else {
                await partylistAPI.rejectMembership(membershipId);
                setSuccess("Membership request rejected.");
            }
            fetchRequests();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    `Failed to ${action} membership request`,
            );
        } finally {
            setActionLoading(null);
        }
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
        };
        return config[status] || config.pending;
    };

    const stats = {
        total: requests.length,
        pending: requests.filter((r) => r.status === "pending").length,
        approved: requests.filter((r) => r.status === "approved").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
    };

    if (loading && !requests.length) {
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
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-5 h-5 text-yellow-300" />
                        <Badge className="bg-white/20 text-white border-0">
                            Membership Requests
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Partylist Membership Requests
                    </h1>
                    <p className="text-blue-100 mt-1">
                        Review and manage membership requests for your
                        partylists
                    </p>
                </div>
            </div>

            {/* Success/Error */}
            {success && (
                <Alert className="bg-green-50 border-green-200 rounded-xl">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">
                        {success}
                    </AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Stats Pills */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Total
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {stats.total}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                        Pending
                    </span>
                    <span className="text-sm font-bold text-yellow-800">
                        {stats.pending}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        Approved
                    </span>
                    <span className="text-sm font-bold text-green-800">
                        {stats.approved}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                    <UserX className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                        Rejected
                    </span>
                    <span className="text-sm font-bold text-red-800">
                        {stats.rejected}
                    </span>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        Filters
                    </CardTitle>
                </div>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Status
                            </label>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Filter by status" />
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
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search by name or partylist..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10 rounded-xl bg-gray-50"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
                <Card className="border-0 shadow-lg rounded-xl">
                    <CardContent className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No Membership Requests
                        </h3>
                        <p className="text-gray-500">
                            {statusFilter !== "all"
                                ? `No ${statusFilter} membership requests found`
                                : "No membership requests found"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredRequests.map((request) => {
                        const status = getStatusBadge(request.status);
                        const user = request.candidate?.user;
                        return (
                            <Card
                                key={request.membership_id}
                                className="border-0 shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <CardContent className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <Avatar className="w-14 h-14 ring-2 ring-blue-100 flex-shrink-0">
                                            <AvatarImage
                                                src={
                                                    user?.face_reference_photo ||
                                                    undefined
                                                }
                                            />
                                            <AvatarFallback className="bg-blue-500 text-white font-bold">
                                                {user?.first_name?.[0]}
                                                {user?.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {user?.first_name}{" "}
                                                    {user?.last_name}
                                                </h3>
                                                <Badge
                                                    className={status.color}
                                                >
                                                    {status.label}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {user?.email}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <GraduationCap className="w-3 h-3" />
                                                    {user?.course?.course_code ||
                                                        "N/A"}{" "}
                                                    - Year{" "}
                                                    {user?.year_level || "N/A"}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    {request.partylist?.name}
                                                </span>
                                            </div>
                                            {request.candidate?.position && (
                                                <p className="text-sm text-blue-600 font-medium mt-1">
                                                    Position:{" "}
                                                    {
                                                        request.candidate
                                                            .position.title
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        {request.status === "pending" && (
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleProcess(
                                                            request.membership_id,
                                                            "reject",
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ===
                                                        request.membership_id
                                                    }
                                                    className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                                                >
                                                    {actionLoading ===
                                                    request.membership_id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                    )}
                                                    Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleProcess(
                                                            request.membership_id,
                                                            "approve",
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ===
                                                        request.membership_id
                                                    }
                                                    className="bg-green-600 hover:bg-green-700 rounded-xl"
                                                >
                                                    {actionLoading ===
                                                    request.membership_id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                    )}
                                                    Approve
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PartylistRequestManager;