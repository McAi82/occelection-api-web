// resources/js/pages/Dashboard/VoterApplications.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
    candidacyAPI,
    CandidacyApplication,
} from "../api/candidacy";
import { electionAPI } from "../api/elections";
import { useAuth } from "../contexts/AuthContext";
import {
    FileText,
    Download,
    Loader2,
    RefreshCw,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    UserPlus,
    Filter,
    Award,
    Calendar,
    GraduationCap,
    Sparkles,
    Eye,
    Building2,
    UserCheck,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
}

interface AvailableElectionItem {
    election_id: number;
    title: string;
    election_type: string;
    description?: string;
    voting_start: string;
    voting_end: string;
    course?: {
        course_id: number;
        course_code: string;
        course_name: string;
    };
    is_available: boolean;
}

const VoterApplications: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [applications, setApplications] = useState<CandidacyApplication[]>(
        [],
    );
    const [elections, setElections] = useState<Election[]>([]);
    const [availableElections, setAvailableElections] = useState<
        AvailableElectionItem[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const electionsRes = await electionAPI.getAll();
            setElections(
                Array.isArray(electionsRes.data) ? electionsRes.data : [],
            );

            const appsRes = await candidacyAPI.getMyApplications();
            setApplications(appsRes.data || []);

            try {
                const availableRes = await candidacyAPI.getAvailableElections();
                setAvailableElections(availableRes.data.available || []);
            } catch (err) {
                console.warn("Failed to fetch available elections:", err);
                setAvailableElections([]);
            }
        } catch (error: any) {
            console.error("Failed to fetch applications:", error);
            setError(
                error.response?.data?.message ||
                    "Failed to load your applications",
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleDownloadLetter = async (applicationId: number) => {
        setDownloading(applicationId);
        try {
            const blob =
                await candidacyAPI.downloadMyRecommendationLetter(
                    applicationId,
                );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "recommendation_letter.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error("Failed to download letter:", error);
            alert(
                error.message ||
                    "Failed to download recommendation letter. Please try again.",
            );
        } finally {
            setDownloading(null);
        }
    };

    const handleApply = (electionId: number) => {
        window.open(`/apply-candidacy/${electionId}`, "_blank");
    };

    const getAdminStatusBadge = (status: string) => {
        const config: Record<
            string,
            { label: string; color: string; icon: React.ReactNode }
        > = {
            pending: {
                label: "Pending Admin Review",
                color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                icon: <Clock className="w-3 h-3 mr-1" />,
            },
            approved: {
                label: "Admin Approved",
                color: "bg-blue-100 text-blue-800 border-blue-200",
                icon: <CheckCircle className="w-3 h-3 mr-1" />,
            },
            rejected: {
                label: "Rejected",
                color: "bg-red-100 text-red-800 border-red-200",
                icon: <XCircle className="w-3 h-3 mr-1" />,
            },
        };
        return config[status] || config.pending;
    };

    const getComelecStatusBadge = (status: string) => {
        const config: Record<
            string,
            { label: string; color: string; icon: React.ReactNode }
        > = {
            pending: {
                label: "Pending COMELEC",
                color: "bg-gray-100 text-gray-800 border-gray-200",
                icon: <Clock className="w-3 h-3 mr-1" />,
            },
            approved: {
                label: "✅ Approved as Candidate",
                color: "bg-green-100 text-green-800 border-green-200",
                icon: <CheckCircle className="w-3 h-3 mr-1" />,
            },
            rejected: {
                label: "Rejected by COMELEC",
                color: "bg-red-100 text-red-800 border-red-200",
                icon: <XCircle className="w-3 h-3 mr-1" />,
            },
        };
        return config[status] || config.pending;
    };

    const getElectionTitle = (electionId: number) => {
        const election = elections.find((e) => e.election_id === electionId);
        return election?.title || `Election #${electionId}`;
    };

    const getOrganizationDisplay = (formData: any) => {
        if (formData?.positionCSG && formData?.positionSC)
            return "CSG & Student Council";
        if (formData?.positionCSG) return "CSG";
        if (formData?.positionSC) return "Student Council";
        return "N/A";
    };

    const filteredApplications =
        selectedStatus === "all"
            ? applications
            : applications.filter((app) => app.admin_status === selectedStatus);

    const isCandidate = applications.some(
        (app) =>
            app.admin_status === "approved" &&
            app.comelec_status === "approved",
    );

    const statusCounts = {
        total: applications.length,
        pending: applications.filter((a) => a.admin_status === "pending")
            .length,
        approved: applications.filter((a) => a.admin_status === "approved")
            .length,
        rejected: applications.filter((a) => a.admin_status === "rejected")
            .length,
        comelec_approved: applications.filter(
            (a) => a.comelec_status === "approved",
        ).length,
    };

    if (loading) {
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
                                <FileText className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    My Applications
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                My Candidacy Applications
                            </h1>
                            <p className="text-blue-100 mt-1">
                                Track your candidacy application status and
                                download your recommendation letter
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                                <FileText className="w-4 h-4 mr-1" />
                                {applications.length} Applications
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

            {/* Stats Pills */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Total
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {statusCounts.total}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                        Pending
                    </span>
                    <span className="text-sm font-bold text-yellow-800">
                        {statusCounts.pending}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                        Admin Approved
                    </span>
                    <span className="text-sm font-bold text-blue-800">
                        {statusCounts.approved}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <UserPlus className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        Official Candidate
                    </span>
                    <span className="text-sm font-bold text-green-800">
                        {statusCounts.comelec_approved}
                    </span>
                </div>
                {isCandidate && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                        <UserCheck className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            You are a Candidate!
                        </span>
                    </div>
                )}
            </div>

            {/* Available Elections */}
            {!isCandidate && availableElections.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-purple-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            <h3 className="text-sm font-semibold text-gray-900">
                                Available Elections to Apply For
                            </h3>
                            <Badge className="bg-purple-100 text-purple-700">
                                {availableElections.length}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Apply for candidacy in these active elections
                        </p>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableElections.map((election) => (
                                <div
                                    key={election.election_id}
                                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">
                                                {election.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {election.election_type}
                                                </Badge>
                                                {election.course && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs bg-gray-50"
                                                    >
                                                        {
                                                            election.course
                                                                .course_code
                                                        }
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Badge className="bg-green-100 text-green-700 border-0">
                                            <UserPlus className="w-3 h-3 mr-1" />
                                            Open
                                        </Badge>
                                    </div>

                                    {election.description && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                            {election.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(
                                                election.voting_start,
                                            ).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(
                                                election.voting_end,
                                            ).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t flex gap-2">
                                        <Button
                                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                                            size="sm"
                                            onClick={() =>
                                                handleApply(
                                                    election.election_id,
                                                )
                                            }
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Apply Now
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-gray-200 text-gray-600 hover:bg-gray-50"
                                            onClick={() =>
                                                navigate(
                                                    `/elections/${election.election_id}`,
                                                )
                                            }
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Candidate Message */}
            {isCandidate && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-green-800">
                                You are an Official Candidate!
                            </h4>
                            <p className="text-sm text-green-700">
                                You are already approved as a candidate. You
                                cannot apply for additional elections.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Filter by Status
                        </h3>
                    </div>
                </div>
                <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                        <button
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                selectedStatus === "all"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            onClick={() => setSelectedStatus("all")}
                        >
                            All ({statusCounts.total})
                        </button>
                        <button
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                selectedStatus === "pending"
                                    ? "bg-yellow-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            onClick={() => setSelectedStatus("pending")}
                        >
                            <Clock className="w-3 h-3 mr-1" />
                            Pending ({statusCounts.pending})
                        </button>
                        <button
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                selectedStatus === "approved"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            onClick={() => setSelectedStatus("approved")}
                        >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Admin Approved ({statusCounts.approved})
                        </button>
                        <button
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                selectedStatus === "rejected"
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            onClick={() => setSelectedStatus("rejected")}
                        >
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected ({statusCounts.rejected})
                        </button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Applications List */}
            {applications.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Applications Yet
                    </h3>
                    <p className="text-gray-500">
                        You haven't submitted any candidacy applications yet.
                    </p>
                    {availableElections.length > 0 && !isCandidate && (
                        <Button
                            className="mt-4 bg-purple-600 hover:bg-purple-700 rounded-xl"
                            onClick={() => {
                                const firstElection = availableElections[0];
                                if (firstElection) {
                                    handleApply(firstElection.election_id);
                                }
                            }}
                        >
                            <UserPlus className="w-4 h-4 mr-2" /> Apply Now
                        </Button>
                    )}
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Applications Match
                    </h3>
                    <p className="text-gray-500">
                        Try changing your filter to see more applications.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-4 rounded-xl"
                        onClick={() => setSelectedStatus("all")}
                    >
                        Clear Filter
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map((app) => {
                        const adminStatus = getAdminStatusBadge(
                            app.admin_status,
                        );
                        const comelecStatus = getComelecStatusBadge(
                            app.comelec_status,
                        );
                        const canDownload = app.admin_status === "approved";
                        const isOfficialCandidate =
                            app.comelec_status === "approved";

                        return (
                            <div
                                key={app.application_id}
                                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                <div
                                    className={`h-1 ${
                                        isOfficialCandidate
                                            ? "bg-green-500"
                                            : app.admin_status === "approved"
                                              ? "bg-blue-500"
                                              : app.admin_status === "rejected"
                                                ? "bg-red-500"
                                                : "bg-yellow-500"
                                    }`}
                                />

                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {getElectionTitle(
                                                        app.election_id,
                                                    )}
                                                </h3>
                                                <Badge
                                                    className={
                                                        adminStatus.color
                                                    }
                                                >
                                                    {adminStatus.icon}{" "}
                                                    {adminStatus.label}
                                                </Badge>
                                                <Badge
                                                    className={
                                                        comelecStatus.color
                                                    }
                                                >
                                                    {comelecStatus.icon}{" "}
                                                    {comelecStatus.label}
                                                </Badge>
                                                {isOfficialCandidate && (
                                                    <Badge className="bg-green-100 text-green-800 border-0">
                                                        <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                                        Candidate
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Award className="w-4 h-4 text-blue-500" />
                                                    <span className="font-medium">
                                                        Position:
                                                    </span>
                                                    <span>
                                                        {app.form_data
                                                            ?.selectedPosition ||
                                                            "N/A"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Building2 className="w-4 h-4 text-purple-500" />
                                                    <span className="font-medium">
                                                        Organization:
                                                    </span>
                                                    <span>
                                                        {getOrganizationDisplay(
                                                            app.form_data,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <GraduationCap className="w-4 h-4 text-green-500" />
                                                    <span className="font-medium">
                                                        Course:
                                                    </span>
                                                    <span>
                                                        {app.form_data
                                                            ?.course || "N/A"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">
                                                        Submitted:
                                                    </span>
                                                    <span>
                                                        {new Date(
                                                            app.created_at,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {app.admin_remarks && (
                                                <p className="text-sm text-gray-500 mt-2">
                                                    <span className="font-medium">
                                                        Admin Remarks:
                                                    </span>{" "}
                                                    {app.admin_remarks}
                                                </p>
                                            )}
                                            {app.comelec_remarks && (
                                                <p className="text-sm text-gray-500">
                                                    <span className="font-medium">
                                                        COMELEC Remarks:
                                                    </span>{" "}
                                                    {app.comelec_remarks}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 items-center flex-shrink-0">
                                            {canDownload && (
                                                <Button
                                                    variant="outline"
                                                    className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                                                    onClick={() =>
                                                        handleDownloadLetter(
                                                            app.application_id,
                                                        )
                                                    }
                                                    disabled={
                                                        downloading ===
                                                        app.application_id
                                                    }
                                                >
                                                    {downloading ===
                                                    app.application_id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Download className="w-4 h-4" />
                                                    )}
                                                    Download Letter
                                                </Button>
                                            )}
                                            {isOfficialCandidate && (
                                                <Badge className="bg-green-100 text-green-800 border-0 px-3 py-1.5">
                                                    <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                                    Official Candidate
                                                </Badge>
                                            )}
                                            {!canDownload &&
                                                app.admin_status ===
                                                    "pending" && (
                                                    <Badge className="bg-yellow-100 text-yellow-800 border-0 px-3 py-1.5">
                                                        <Clock className="w-3 h-3 mr-1" />{" "}
                                                        Awaiting Review
                                                    </Badge>
                                                )}
                                            {app.admin_status ===
                                                "rejected" && (
                                                <Badge className="bg-red-100 text-red-800 border-0 px-3 py-1.5">
                                                    <XCircle className="w-3 h-3 mr-1" />{" "}
                                                    Rejected
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-800">
                            Application Process
                        </h4>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1">
                            <li>
                                • <strong>Step 1:</strong> Submit your
                                application → Admin reviews and approves
                            </li>
                            <li>
                                • <strong>Step 2:</strong> Download your
                                recommendation letter after admin approval
                            </li>
                            <li>
                                • <strong>Step 3:</strong> COMELEC reviews and
                                approves you as an official candidate
                            </li>
                            <li>
                                • <strong>Step 4:</strong> Once approved by
                                COMELEC, you become an official candidate
                            </li>
                            <li>
                                • <strong>Note:</strong> You can only apply for
                                one election at a time
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoterApplications;