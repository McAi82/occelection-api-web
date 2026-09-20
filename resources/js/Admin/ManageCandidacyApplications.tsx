// resources/js/pages/Admin/ManageCandidacyApplications.tsx
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
import { Label } from "../components/ui/label";
import { candidacyAPI, CandidacyApplication } from "../api/candidacy";
import { electionAPI } from "../api/elections";
import {
    Users,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw,
    Eye,
    FileText,
    Download,
    UserCheck,
    Clock,
    AlertCircle,
    Search,
    Filter,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
}

const ManageCandidacyApplications: React.FC = () => {
    const [applications, setApplications] = useState<CandidacyApplication[]>(
        [],
    );
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedApp, setSelectedApp] = useState<CandidacyApplication | null>(
        null,
    );
    const [detailOpen, setDetailOpen] = useState(false);
    const [remarks, setRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("pending");
    const [electionFilter, setElectionFilter] = useState<string>("all");
    const [elections, setElections] = useState<Election[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchElections();
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [statusFilter, electionFilter]);

    const fetchElections = async () => {
        try {
            const response = await electionAPI.getAll();
            setElections(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Failed to fetch elections:", error);
        }
    };

    const fetchApplications = async () => {
        setLoading(true);
        setError("");
        try {
            const params: any = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (electionFilter !== "all")
                params.election_id = parseInt(electionFilter);

            const response = await candidacyAPI.adminGetApplications(params);
            console.log("Raw API response:", response);

            let applicationsData: CandidacyApplication[] = [];

            if (Array.isArray(response.data)) {
                applicationsData = response.data;
            } else if (response.data && typeof response.data === "object") {
                if (response.data.data && Array.isArray(response.data.data)) {
                    applicationsData = response.data.data;
                } else if (
                    response.data.data &&
                    response.data.data.data &&
                    Array.isArray(response.data.data.data)
                ) {
                    applicationsData = response.data.data.data;
                } else if (Array.isArray(response.data)) {
                    applicationsData = response.data;
                }
            }

            console.log("Extracted applications:", applicationsData);
            setApplications(applicationsData);
        } catch (error: any) {
            console.error("Failed to fetch applications:", error);
            setError(
                error.response?.data?.message || "Failed to load applications",
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchApplications();
    };

    const handleViewDetail = (app: CandidacyApplication) => {
        setSelectedApp(app);
        setRemarks("");
        setDetailOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedApp) return;
        setActionLoading(true);
        try {
            await candidacyAPI.adminApprove(
                selectedApp.application_id,
                remarks,
            );
            setDetailOpen(false);
            fetchApplications();
        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                    "Failed to approve application",
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedApp) return;
        setActionLoading(true);
        try {
            await candidacyAPI.adminReject(selectedApp.application_id, remarks);
            setDetailOpen(false);
            fetchApplications();
        } catch (error: any) {
            setError(
                error.response?.data?.message || "Failed to reject application",
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadLetter = async (app: CandidacyApplication) => {
        try {
            const blob = await candidacyAPI.downloadRecommendationLetter(
                app.application_id,
            );

            // ✅ Check if blob is valid
            if (!blob || !(blob instanceof Blob)) {
                throw new Error("Invalid file received");
            }

            // ✅ Check if blob has content
            if (blob.size === 0) {
                throw new Error("File is empty");
            }

            // ✅ Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `recommendation_letter_${app.user?.first_name}_${app.user?.last_name}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            // ✅ Revoke URL after download
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error: any) {
            console.error("Failed to download letter:", error);
            alert(
                error.message ||
                    "Failed to download recommendation letter. Please try again.",
            );
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

    const filteredApplications = applications.filter((app) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const name =
            `${app.user?.first_name || ""} ${app.user?.last_name || ""}`.toLowerCase();
        const studentId = app.user?.student_id?.toLowerCase() || "";
        return name.includes(search) || studentId.includes(search);
    });

    if (loading && !applications.length) {
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
                    <h1 className="text-2xl font-bold text-gray-900">
                        Candidacy Applications
                    </h1>
                    <p className="text-gray-600">
                        Review and approve/reject candidacy applications from
                        students
                    </p>
                </div>
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
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-600">{error}</span>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Status</Label>
                            <select
                                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <Label>Election</Label>
                            <select
                                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={electionFilter}
                                onChange={(e) =>
                                    setElectionFilter(e.target.value)
                                }
                            >
                                <option value="all">All Elections</option>
                                {elections.map((e) => (
                                    <option
                                        key={e.election_id}
                                        value={e.election_id}
                                    >
                                        {e.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Search</Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by name or student ID..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ===== STATS - PILL/BADGE STYLE ===== */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Total
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {applications.length}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                        Pending
                    </span>
                    <span className="text-sm font-bold text-yellow-800">
                        {
                            applications.filter(
                                (a) => a.admin_status === "pending",
                            ).length
                        }
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        Approved
                    </span>
                    <span className="text-sm font-bold text-green-800">
                        {
                            applications.filter(
                                (a) => a.admin_status === "approved",
                            ).length
                        }
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                        Rejected
                    </span>
                    <span className="text-sm font-bold text-red-800">
                        {
                            applications.filter(
                                (a) => a.admin_status === "rejected",
                            ).length
                        }
                    </span>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Applications ({filteredApplications.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredApplications.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No applications found</p>
                            <p className="text-sm mt-1">
                                Try adjusting your filters
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-left">
                                            Applicant
                                        </th>
                                        <th className="p-3 text-left">
                                            Student ID
                                        </th>
                                        <th className="p-3 text-left">
                                            Course
                                        </th>
                                        <th className="p-3 text-left">
                                            Election
                                        </th>
                                        <th className="p-3 text-left">
                                            Status
                                        </th>
                                        <th className="p-3 text-left">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApplications.map((app) => {
                                        const adminStatus = getStatusBadge(
                                            app.admin_status,
                                        );
                                        return (
                                            <tr
                                                key={app.application_id}
                                                className="border-t hover:bg-gray-50"
                                            >
                                                <td className="p-3 font-medium">
                                                    {app.user?.first_name}{" "}
                                                    {app.user?.last_name}
                                                </td>
                                                <td className="p-3 font-mono text-xs">
                                                    {app.user?.student_id}
                                                </td>
                                                <td className="p-3">
                                                    {app.form_data.course ||
                                                        "N/A"}
                                                </td>
                                                <td className="p-3">
                                                    {app.election?.title ||
                                                        "N/A"}
                                                </td>
                                                <td className="p-3">
                                                    <Badge
                                                        className={
                                                            adminStatus.color
                                                        }
                                                    >
                                                        {adminStatus.label}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex gap-2 flex-wrap">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleViewDetail(
                                                                    app,
                                                                )
                                                            }
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            View Details
                                                        </Button>
                                                        {app.admin_status ===
                                                            "approved" &&
                                                            !app.letter_generated && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleDownloadLetter(
                                                                            app,
                                                                        )
                                                                    }
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Application Details</DialogTitle>
                    </DialogHeader>
                    {selectedApp && (
                        <div className="space-y-6">
                            {/* Applicant Information */}
                            <div>
                                <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                                    Applicant Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Name
                                        </p>
                                        <p className="font-semibold">
                                            {selectedApp.user?.first_name}{" "}
                                            {selectedApp.user?.last_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Student ID
                                        </p>
                                        <p className="font-semibold">
                                            {selectedApp.user?.student_id}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Email
                                        </p>
                                        <p className="font-semibold">
                                            {selectedApp.user?.email}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Course
                                        </p>
                                        <p className="font-semibold">
                                            {selectedApp.form_data.course ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Year Level
                                        </p>
                                        <p className="font-semibold">
                                            {selectedApp.form_data
                                                .currentYear || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Age
                                        </p>
                                        <p className="font-semibold">
                                            {selectedApp.form_data.age || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Student No.
                                        </p>
                                        <p className="font-semibold">
                                            {selectedApp.form_data.studentNo ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            No. Unit Load
                                        </p>
                                        <p className="font-semibold">
                                            {selectedApp.form_data.noUnitLoad ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Cellphone
                                        </p>
                                        <p className="font-semibold">
                                            {selectedApp.form_data.cellphone ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Social Media
                                        </p>
                                        <p className="font-semibold">
                                            {selectedApp.form_data
                                                .socialMedia || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                                    Present Address
                                </h3>
                                <p className="text-sm">
                                    {selectedApp.form_data.presentAddress ||
                                        "N/A"}
                                </p>
                                {selectedApp.form_data.presentAddress2 && (
                                    <p className="text-sm mt-1">
                                        {selectedApp.form_data.presentAddress2}
                                    </p>
                                )}
                            </div>

                            {/* Position Applied */}
                            <div>
                                <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                                    Position Applied
                                </h3>
                                <div className="space-y-1">
                                    {selectedApp.form_data.positionCSG && (
                                        <p className="text-sm">
                                            • Central Student Government
                                        </p>
                                    )}
                                    {selectedApp.form_data.positionSC && (
                                        <p className="text-sm">
                                            • Student Council
                                        </p>
                                    )}
                                    {selectedApp.form_data.department && (
                                        <p className="text-sm">
                                            Department:{" "}
                                            {selectedApp.form_data.department}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Political Party */}
                            <div>
                                <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                                    Political Party Affiliation
                                </h3>
                                {selectedApp.form_data.partyIndependent ? (
                                    <p className="text-sm">Independent</p>
                                ) : selectedApp.form_data.partyOther ? (
                                    <p className="text-sm">
                                        Political Party:{" "}
                                        {selectedApp.form_data.politicalParty ||
                                            "N/A"}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Not specified
                                    </p>
                                )}
                            </div>

                            {/* Present Affiliations */}
                            <div>
                                <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                                    Present Affiliations
                                </h3>
                                {[1, 2, 3].map((n) => {
                                    const org = selectedApp.form_data[
                                        `aff${n}Org` as keyof typeof selectedApp.form_data
                                    ] as string;
                                    const pos = selectedApp.form_data[
                                        `aff${n}Pos` as keyof typeof selectedApp.form_data
                                    ] as string;
                                    const date = selectedApp.form_data[
                                        `aff${n}Date` as keyof typeof selectedApp.form_data
                                    ] as string;
                                    if (org || pos || date) {
                                        return (
                                            <div key={n} className="text-sm">
                                                <span className="font-medium">
                                                    #{n}
                                                </span>{" "}
                                                {org || "N/A"} - {pos || "N/A"}{" "}
                                                ({date || "N/A"})
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                                {[1, 2, 3].every(
                                    (n) =>
                                        !selectedApp.form_data[
                                            `aff${n}Org` as keyof typeof selectedApp.form_data
                                        ],
                                ) && (
                                    <p className="text-sm text-gray-500">
                                        No affiliations provided
                                    </p>
                                )}
                            </div>

                            {/* Platform & Qualifications */}
                            <div>
                                <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                                    Campaign Platform
                                </h3>
                                <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                                    {selectedApp.form_data.platform ||
                                        "Not provided"}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                                    Qualifications & Achievements
                                </h3>
                                <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                                    {selectedApp.form_data.qualifications ||
                                        "Not provided"}
                                </div>
                            </div>

                            {/* Status & Remarks */}
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Status
                                        </p>
                                        <Badge
                                            className={
                                                getStatusBadge(
                                                    selectedApp.admin_status,
                                                ).color
                                            }
                                        >
                                            {
                                                getStatusBadge(
                                                    selectedApp.admin_status,
                                                ).label
                                            }
                                        </Badge>
                                    </div>
                                </div>
                                {selectedApp.admin_remarks && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        Remarks: {selectedApp.admin_remarks}
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons for pending */}
                            {selectedApp.admin_status === "pending" && (
                                <div className="space-y-3 border-t pt-4">
                                    <Label>Remarks (Optional)</Label>
                                    <Textarea
                                        placeholder="Add remarks for the applicant..."
                                        value={remarks}
                                        onChange={(e) =>
                                            setRemarks(e.target.value)
                                        }
                                        rows={2}
                                    />
                                    <div className="flex gap-3 justify-end">
                                        <Button
                                            variant="destructive"
                                            onClick={handleReject}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4 mr-2" />
                                            )}
                                            Reject
                                        </Button>
                                        <Button
                                            className="bg-green-600"
                                            onClick={handleApprove}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                            )}
                                            Approve & Generate Letter
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {selectedApp.admin_status === "approved" && (
                                <div className="border-t pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            handleDownloadLetter(selectedApp)
                                        }
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Recommendation Letter
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManageCandidacyApplications;
