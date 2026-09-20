// resources/js/pages/Admin/VoterManagement.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Input } from "../components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { adminAPI } from "../api/admin";
import { electionAPI } from "../api/elections";
import { courseAPI } from "../api/courses";
import { useElections } from "../hooks/useElections";
import { RefreshButton } from "../components/common/RefreshButton";
import {
    Users,
    UserCheck,
    UserX,
    Search,
    Loader2,
    Download,
    Eye,
    AlertCircle,
    XCircle,
    CheckCircle,
    Receipt,
    Copy,
    Check,
    Filter,
    School,
    Trash2,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
}

interface Course {
    course_id: number;
    course_code: string;
    course_name: string;
}

interface Voter {
    voter_registry_id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    email: string;
    course_id?: number;
    course: string | { course_code: string; course_name: string; course_id: number };
    year_level: number;
    has_voted: boolean;
    voted_at?: string;
    receipt_code?: string;
}

interface Stats {
    total: number;
    voted: number;
    notVoted: number;
    turnout: number;
}

interface ToastMessage {
    type: "success" | "error" | "info";
    title: string;
    message: string;
}

const VoterManagement: React.FC = () => {
    const { data: elections = [], isLoading: electionsLoading } = useElections();
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [courses, setCourses] = useState<Course[]>([]);
    const [voters, setVoters] = useState<Voter[]>([]);
    const [filteredVoters, setFilteredVoters] = useState<Voter[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCourse, setSelectedCourse] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [error, setError] = useState("");
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const [voterToRemove, setVoterToRemove] = useState<Voter | null>(null);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (elections.length > 0 && !selectedElection) {
            setSelectedElection(elections[0].election_id.toString());
        }
    }, [elections]);

    useEffect(() => {
        if (selectedElection) {
            fetchVoters();
        }
    }, [selectedElection]);

    useEffect(() => {
        applyFilters();
    }, [voters, searchTerm, selectedCourse, selectedStatus]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const showToast = (type: "success" | "error" | "info", title: string, message: string): void => {
        setToast({ type, title, message });
    };

    const fetchCourses = async (): Promise<void> => {
        try {
            const response = await courseAPI.getAll();
            setCourses(response.data || []);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        }
    };

    const fetchVoters = async (): Promise<void> => {
        if (!selectedElection) return;
        setLoading(true);
        setRefreshing(true);
        setError("");
        try {
            const response = await adminAPI.getVoters(selectedElection);
            const responseData = response.data;
            let votersData: Voter[] = [];
            let totalVoters = 0;
            let votedCount = 0;

            if (responseData && typeof responseData === "object") {
                if (responseData.data && responseData.data.voters) {
                    votersData = responseData.data.voters || [];
                    totalVoters = responseData.data.total_voters || 0;
                    votedCount = responseData.data.voted_count || 0;
                } else if (responseData.voters) {
                    votersData = responseData.voters || [];
                    totalVoters = responseData.total_voters || 0;
                    votedCount = responseData.voted_count || 0;
                } else if (Array.isArray(responseData)) {
                    votersData = responseData;
                    totalVoters = votersData.length;
                    votedCount = votersData.filter((v) => v.has_voted).length;
                }
            }

            const votersWithReceipts = await Promise.all(
                votersData.map(async (voter) => {
                    if (voter.has_voted && voter.voter_registry_id) {
                        try {
                            const receiptResponse = await adminAPI.getVoterReceipt(
                                selectedElection,
                                voter.voter_registry_id
                            );
                            return {
                                ...voter,
                                receipt_code: receiptResponse.data?.receipt_code || null,
                            };
                        } catch (error) {
                            return { ...voter, receipt_code: null };
                        }
                    }
                    return { ...voter, receipt_code: null };
                })
            );

            setVoters(votersWithReceipts);
            setStats({
                total: totalVoters,
                voted: votedCount,
                notVoted: totalVoters - votedCount,
                turnout: totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0,
            });
        } catch (error: any) {
            console.error("Failed to fetch voters:", error);
            setError(error.response?.data?.message || "Failed to load voters");
            showToast("error", "Error", error.response?.data?.message || "Failed to load voters");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getCourseDisplay = (voter: Voter): string => {
        if (!voter.course) return "N/A";
        if (typeof voter.course === "object" && voter.course.course_code) {
            return voter.course.course_code;
        }
        if (typeof voter.course === "string") {
            return voter.course;
        }
        return "N/A";
    };

    const getFullName = (voter: Voter): string => {
        return `${voter.first_name || ""} ${voter.last_name || ""}`.trim() || "-";
    };

    const applyFilters = (): void => {
        let filtered = [...voters];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (voter) =>
                    getFullName(voter).toLowerCase().includes(search) ||
                    (voter.student_id && voter.student_id.toLowerCase().includes(search)) ||
                    (voter.email && voter.email.toLowerCase().includes(search)) ||
                    (voter.receipt_code && voter.receipt_code.toLowerCase().includes(search))
            );
        }

        if (selectedCourse !== "all") {
            filtered = filtered.filter((voter) => {
                const courseCode = getCourseDisplay(voter);
                return courseCode === selectedCourse;
            });
        }

        if (selectedStatus !== "all") {
            filtered = filtered.filter((voter) =>
                selectedStatus === "voted" ? voter.has_voted : !voter.has_voted
            );
        }

        setFilteredVoters(filtered);
    };

    const handleRemoveVoter = async (): Promise<void> => {
        if (!voterToRemove || !voterToRemove.voter_registry_id) return;
        setRemoving(true);
        try {
            await adminAPI.removeVoter(selectedElection, voterToRemove.voter_registry_id);
            showToast("success", "Voter Removed", `${getFullName(voterToRemove)} has been removed from this election`);
            setRemoveDialogOpen(false);
            setVoterToRemove(null);
            fetchVoters();
        } catch (error: any) {
            showToast("error", "Remove Failed", error.response?.data?.message || "Failed to remove voter");
        } finally {
            setRemoving(false);
        }
    };

    const handleViewReceipt = (receiptCode: string) => {
        setSelectedReceipt(receiptCode);
        setReceiptDialogOpen(true);
    };

    const handleCopyReceipt = async () => {
        if (selectedReceipt) {
            await navigator.clipboard.writeText(selectedReceipt);
            setCopied(true);
        }
    };

    const clearFilters = (): void => {
        setSearchTerm("");
        setSelectedCourse("all");
        setSelectedStatus("all");
    };

    const exportToCSV = (): void => {
        if (filteredVoters.length === 0) {
            showToast("error", "Export Failed", "No data to export");
            return;
        }

        const headers = ["Student ID", "Name", "Email", "Course", "Year Level", "Status", "Voted At", "Receipt Code"];
        const csvRows = [
            headers.join(","),
            ...filteredVoters.map((voter) =>
                [
                    `"${voter.student_id || ""}"`,
                    `"${getFullName(voter)}"`,
                    `"${voter.email || ""}"`,
                    `"${getCourseDisplay(voter)}"`,
                    `"${voter.year_level || ""}"`,
                    `"${voter.has_voted ? "Voted" : "Not Voted"}"`,
                    `"${voter.voted_at ? new Date(voter.voted_at).toLocaleString() : ""}"`,
                    `"${voter.receipt_code || ""}"`,
                ].join(",")
            ),
        ];

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `voters_${selectedElection}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("success", "Exported", `Exported ${filteredVoters.length} voters to CSV`);
    };

    const statusCounts = {
        voted: voters.filter((v) => v.has_voted).length,
        notVoted: voters.filter((v) => !v.has_voted).length,
    };

    const courseCounts: Record<string, number> = {};
    voters.forEach((voter) => {
        const course = getCourseDisplay(voter);
        courseCounts[course] = (courseCounts[course] || 0) + 1;
    });

    const ToastNotification: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
        const icons = {
            success: <CheckCircle className="w-5 h-5 text-green-600" />,
            error: <XCircle className="w-5 h-5 text-red-600" />,
            info: <AlertCircle className="w-5 h-5 text-blue-600" />,
        };
        const colors = {
            success: "bg-green-50 border-green-200",
            error: "bg-red-50 border-red-200",
            info: "bg-blue-50 border-blue-200",
        };
        const textColors = {
            success: "text-green-800",
            error: "text-red-800",
            info: "text-blue-800",
        };

        return (
            <div className="fixed top-20 right-4 z-50 max-w-md animate-in slide-in-from-right-5 duration-300">
                <div className={`rounded-lg border p-4 shadow-lg ${colors[toast.type]}`}>
                    <div className="flex items-start gap-3">
                        {icons[toast.type]}
                        <div className="flex-1">
                            <h4 className={`font-semibold ${textColors[toast.type]}`}>{toast.title}</h4>
                            <p className={`text-sm mt-1 ${textColors[toast.type]}`}>{toast.message}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (electionsLoading || loading && !voters.length) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}

            <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-blue-600" />
                            Vote Receipt
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-500 mb-2">Receipt Code</p>
                            <p className="font-mono text-lg font-bold text-blue-600 break-all">{selectedReceipt}</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleCopyReceipt} className="gap-2">
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-600" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy Code
                                    </>
                                )}
                            </Button>
                            <Button onClick={() => setReceiptDialogOpen(false)}>Close</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Voter</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove{" "}
                            <span className="font-semibold">{voterToRemove ? getFullName(voterToRemove) : ""}</span>{" "}
                            from this election?
                            {voterToRemove?.has_voted && (
                                <span className="block mt-2 text-red-600">
                                    ⚠️ Warning: This voter has already cast their vote.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveVoter} disabled={removing} className="bg-red-600 hover:bg-red-700">
                            {removing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Remove Voter
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Voter Management</h1>
                    <p className="text-gray-600">View, filter, and manage registered voters per election</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={exportToCSV} disabled={voters.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <RefreshButton onClick={fetchVoters} isLoading={refreshing} />
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
                        <option value="">Select an election</option>
                        {elections.map((election: any) => (
                            <option key={election.election_id} value={election.election_id}>
                                {election.title}
                            </option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {/* ===== STATS - PILL/BADGE STYLE ===== */}
{stats && stats.total > 0 && (
    <div className="flex flex-wrap items-center gap-3 py-1">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Total</span>
            <span className="text-sm font-bold text-gray-900">{stats.total}</span>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <UserCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Voted</span>
            <span className="text-sm font-bold text-green-800">{stats.voted}</span>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
            <UserX className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Not Voted</span>
            <span className="text-sm font-bold text-red-800">{stats.notVoted}</span>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
            <Eye className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Turnout</span>
            <span className="text-sm font-bold text-purple-800">{stats.turnout}%</span>
        </div>
    </div>
)}

            <Card>
                <CardContent className="p-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <h3 className="font-semibold text-gray-700">Filters</h3>
                            {(searchTerm || selectedCourse !== "all" || selectedStatus !== "all") && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:text-red-700">
                                    Clear all filters
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search by name, ID, email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="relative">
                                <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    className="w-full pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                >
                                    <option value="all">All Courses ({voters.length})</option>
                                    {courses.map((course) => (
                                        <option key={course.course_id} value={course.course_code}>
                                            {course.course_code} ({courseCounts[course.course_code] || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    className="w-full pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="all">All Status ({voters.length})</option>
                                    <option value="voted">Voted ({statusCounts.voted})</option>
                                    <option value="not_voted">Not Voted ({statusCounts.notVoted})</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Showing {filteredVoters.length} of {voters.length} voters</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Voter List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-left">Student ID</th>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Email</th>
                                    <th className="p-3 text-left">Course</th>
                                    <th className="p-3 text-left">Year</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-left">Voted At</th>
                                    <th className="p-3 text-left">Receipt Code</th>
                                    <th className="p-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVoters.length > 0 ? (
                                    filteredVoters.map((voter, index) => (
                                        <tr key={voter.voter_registry_id || index} className="border-t hover:bg-gray-50">
                                            <td className="p-3 font-mono">{voter.student_id || "-"}</td>
                                            <td className="p-3 font-medium">{getFullName(voter)}</td>
                                            <td className="p-3">{voter.email || "-"}</td>
                                            <td className="p-3">{getCourseDisplay(voter)}</td>
                                            <td className="p-3">{voter.year_level ? `Year ${voter.year_level}` : "-"}</td>
                                            <td className="p-3">
                                                {voter.has_voted ? (
                                                    <Badge className="bg-green-100 text-green-800">Voted</Badge>
                                                ) : (
                                                    <Badge className="bg-yellow-100 text-yellow-800">Not Voted</Badge>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {voter.voted_at ? new Date(voter.voted_at).toLocaleString() : "-"}
                                            </td>
                                            <td className="p-3">
                                                {voter.has_voted && voter.receipt_code ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1 text-blue-600 hover:text-blue-700"
                                                        onClick={() => handleViewReceipt(voter.receipt_code!)}
                                                    >
                                                        <Receipt className="w-4 h-4" />
                                                        View
                                                    </Button>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">No receipt</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => {
                                                        setVoterToRemove(voter);
                                                        setRemoveDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-gray-500">
                                            {loading ? (
                                                <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
                                            ) : (
                                                <>
                                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                    <p>No voters found matching your filters</p>
                                                    <Button variant="link" onClick={clearFilters} className="mt-2">
                                                        Clear filters
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default VoterManagement;