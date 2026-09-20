// resources/js/pages/Admin/ElectionRecords.tsx
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import {
    Loader2,
    RefreshCw,
    FileText,
    Download,
    Eye,
    Calendar,
    Users,
    Vote,
    TrendingUp,
    FolderOpen,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    FileJson,
} from "lucide-react";
import {
    electionRecordsAPI,
    ElectionRecord,
    YearlyStats,
    ElectionRecordDetail,
} from "../api/electionRecords";
import { format } from "date-fns";

const ElectionRecords: React.FC = () => {
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedElection, setSelectedElection] =
        useState<ElectionRecordDetail | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const queryClient = useQueryClient();

    // Fetch years
    const yearsQuery = useQuery({
        queryKey: ["records-years"],
        queryFn: async () => {
            const response = await electionRecordsAPI.getYears();
            return response.data;
        },
    });

    // Fetch yearly stats
    const statsQuery = useQuery({
        queryKey: ["records-stats"],
        queryFn: async () => {
            const response = await electionRecordsAPI.getYearlyStats();
            return response.data;
        },
    });

    // Fetch year records
    const recordsQuery = useQuery({
        queryKey: ["records-year", selectedYear],
        queryFn: async () => {
            if (!selectedYear) return null;
            const response =
                await electionRecordsAPI.getYearRecords(selectedYear);
            return response.data;
        },
        enabled: !!selectedYear,
    });

    // Fetch election detail
    const detailQuery = useQuery({
        queryKey: ["records-election", selectedElection?.election_id],
        queryFn: async () => {
            if (!selectedElection) return null;
            const response = await electionRecordsAPI.getElectionDetail(
                selectedElection.election_id,
            );
            return response.data;
        },
        enabled: !!selectedElection,
    });

    // Set default year when years load
    React.useEffect(() => {
        if (yearsQuery.data && yearsQuery.data.length > 0 && !selectedYear) {
            setSelectedYear(yearsQuery.data[0]);
        }
    }, [yearsQuery.data, selectedYear]);

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; color: string }> = {
            upcoming: {
                label: "Upcoming",
                color: "bg-yellow-100 text-yellow-800",
            },
            ongoing: { label: "Ongoing", color: "bg-green-100 text-green-800" },
            ended: { label: "Ended", color: "bg-gray-100 text-gray-800" },
        };
        return config[status] || config.ended;
    };

    const handleViewDetail = (election: ElectionRecord) => {
        setSelectedElection({
            ...election,
            positions: [],
            voters_list: [],
            partylists: [],
            timeline: [],
        } as ElectionRecordDetail);
        setDetailOpen(true);
    };

    const handleExportYear = async (format: "csv" | "pdf") => {
        if (!selectedYear) return;
        try {
            const blob = await electionRecordsAPI.exportYearRecords(
                selectedYear,
                format,
            );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `election_records_${selectedYear}.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    const handleExportElection = async (
        electionId: number,
        format: "csv" | "pdf",
    ) => {
        try {
            const blob = await electionRecordsAPI.exportElection(
                electionId,
                format,
            );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `election_${electionId}_results.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    const getPaginationData = () => {
        if (!recordsQuery.data?.elections)
            return { paginated: [], totalPages: 0 };
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return {
            paginated: recordsQuery.data.elections.slice(start, end),
            totalPages: Math.ceil(
                recordsQuery.data.elections.length / itemsPerPage,
            ),
        };
    };

    const { paginated, totalPages } = getPaginationData();

    const isLoading =
        yearsQuery.isLoading || statsQuery.isLoading || recordsQuery.isLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Election Records
                    </h1>
                    <p className="text-gray-600">
                        View and manage historical election records
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            queryClient.invalidateQueries({
                                queryKey: ["records-years"],
                            });
                            queryClient.invalidateQueries({
                                queryKey: ["records-stats"],
                            });
                            queryClient.invalidateQueries({
                                queryKey: ["records-year", selectedYear],
                            });
                        }}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {selectedYear && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => handleExportYear("csv")}
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleExportYear("pdf")}
                            >
                                <FileJson className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Year Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Select Year
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {yearsQuery.data?.map((year) => (
                            <Button
                                key={year}
                                variant={
                                    selectedYear === year
                                        ? "default"
                                        : "outline"
                                }
                                className={
                                    selectedYear === year
                                        ? "bg-blue-600"
                                        : ""
                                }
                                onClick={() => setSelectedYear(year)}
                            >
                                {year}
                            </Button>
                        ))}
                        {yearsQuery.data?.length === 0 && (
                            <p className="text-gray-500">No records found</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ===== STATS - PILL/BADGE STYLE ===== */}
            {statsQuery.data && selectedYear && (
                <div className="flex flex-wrap items-center gap-3 py-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">
                            Elections
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                            {recordsQuery.data?.total_elections || 0}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            Voters
                        </span>
                        <span className="text-sm font-bold text-green-800">
                            {recordsQuery.data?.total_voters || 0}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                        <Vote className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">
                            Votes Cast
                        </span>
                        <span className="text-sm font-bold text-purple-800">
                            {recordsQuery.data?.total_votes_cast || 0}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">
                            Avg Turnout
                        </span>
                        <span className="text-sm font-bold text-amber-800">
                            {recordsQuery.data?.avg_turnout || 0}%
                        </span>
                    </div>
                </div>
            )}

            {/* Yearly Stats Chart */}
            {statsQuery.data && statsQuery.data.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Yearly Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-left">Year</th>
                                        <th className="p-3 text-left">
                                            Elections
                                        </th>
                                        <th className="p-3 text-left">CSG</th>
                                        <th className="p-3 text-left">SBO</th>
                                        <th className="p-3 text-left">
                                            Total Voters
                                        </th>
                                        <th className="p-3 text-left">
                                            Votes Cast
                                        </th>
                                        <th className="p-3 text-left">
                                            Avg Turnout
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statsQuery.data.map((stat) => (
                                        <tr
                                            key={stat.year}
                                            className="border-t hover:bg-gray-50"
                                        >
                                            <td className="p-3 font-semibold">
                                                {stat.year}
                                            </td>
                                            <td className="p-3">
                                                {stat.elections_count}
                                            </td>
                                            <td className="p-3">
                                                {stat.csg_count}
                                            </td>
                                            <td className="p-3">
                                                {stat.sbo_count}
                                            </td>
                                            <td className="p-3">
                                                {stat.total_voters}
                                            </td>
                                            <td className="p-3">
                                                {stat.total_votes_cast}
                                            </td>
                                            <td className="p-3 font-semibold text-green-600">
                                                {stat.avg_turnout}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Elections List */}
            {recordsQuery.data && recordsQuery.data.elections && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>
                                Elections ({recordsQuery.data.elections.length})
                            </span>
                            <span className="text-sm font-normal text-gray-500">
                                Showing {paginated.length} of{" "}
                                {recordsQuery.data.elections.length}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-left">Title</th>
                                        <th className="p-3 text-left">Type</th>
                                        <th className="p-3 text-left">
                                            Status
                                        </th>
                                        <th className="p-3 text-left">
                                            Candidates
                                        </th>
                                        <th className="p-3 text-left">
                                            Voters
                                        </th>
                                        <th className="p-3 text-left">
                                            Turnout
                                        </th>
                                        <th className="p-3 text-left">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map((election) => {
                                        const status = getStatusBadge(
                                            election.status,
                                        );
                                        return (
                                            <tr
                                                key={election.election_id}
                                                className="border-t hover:bg-gray-50"
                                            >
                                                <td className="p-3 font-medium">
                                                    {election.title}
                                                    {election.course && (
                                                        <span className="text-xs text-gray-500 block">
                                                            {
                                                                election.course
                                                                    .course_code
                                                            }
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant="outline">
                                                        {election.election_type}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    <Badge
                                                        className={status.color}
                                                    >
                                                        {status.label}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    {election.candidates_count}
                                                </td>
                                                <td className="p-3">
                                                    {election.voters_voted} /{" "}
                                                    {election.voters_total}
                                                </td>
                                                <td className="p-3 font-semibold">
                                                    {
                                                        election.turnout_percentage
                                                    }
                                                    %
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleViewDetail(
                                                                    election,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        {election.has_results && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleExportElection(
                                                                            election.election_id,
                                                                            "csv",
                                                                        )
                                                                    }
                                                                >
                                                                    <FileSpreadsheet className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleExportElection(
                                                                            election.election_id,
                                                                            "pdf",
                                                                        )
                                                                    }
                                                                >
                                                                    <FileJson className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {paginated.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="p-8 text-center text-gray-500"
                                            >
                                                No elections found for this year
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />{" "}
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
                                >
                                    Next{" "}
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Election Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            {selectedElection?.title}
                        </DialogTitle>
                    </DialogHeader>
                    {detailQuery.isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : detailQuery.data ? (
                        <div className="space-y-6">
                            {/* Election Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Type
                                    </p>
                                    <p className="font-semibold">
                                        {detailQuery.data.election_type}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Status
                                    </p>
                                    <Badge
                                        className={
                                            getStatusBadge(
                                                detailQuery.data.status,
                                            ).color
                                        }
                                    >
                                        {
                                            getStatusBadge(
                                                detailQuery.data.status,
                                            ).label
                                        }
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Start Date
                                    </p>
                                    <p className="font-semibold">
                                        {format(
                                            new Date(
                                                detailQuery.data.voting_start,
                                            ),
                                            "MMM dd, yyyy",
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        End Date
                                    </p>
                                    <p className="font-semibold">
                                        {format(
                                            new Date(
                                                detailQuery.data.voting_end,
                                            ),
                                            "MMM dd, yyyy",
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Results per position */}
                            {detailQuery.data.positions.map((position) => (
                                <div key={position.position_id}>
                                    <h4 className="text-lg font-semibold border-b pb-2 mb-3">
                                        {position.title}
                                    </h4>
                                    <div className="space-y-2">
                                        {position.candidates.map(
                                            (candidate) => (
                                                <div
                                                    key={candidate.candidate_id}
                                                    className={`flex justify-between items-center p-3 rounded-lg ${candidate.winner ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}
                                                >
                                                    <div>
                                                        <span className="font-medium">
                                                            {
                                                                candidate.first_name
                                                            }{" "}
                                                            {
                                                                candidate.last_name
                                                            }
                                                        </span>
                                                        <span className="text-sm text-gray-500 ml-3">
                                                            {candidate.partylist_name ||
                                                                "Independent"}
                                                        </span>
                                                        {candidate.winner && (
                                                            <Badge className="ml-2 bg-green-500 text-white">
                                                                🏆 Winner
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold">
                                                            {candidate.votes}{" "}
                                                            votes
                                                        </span>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Timeline */}
                            <div>
                                <h4 className="text-lg font-semibold border-b pb-2 mb-3">
                                    Timeline
                                </h4>
                                <div className="space-y-2">
                                    {detailQuery.data.timeline.map(
                                        (event, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3"
                                            >
                                                <div className="w-24 text-sm text-gray-500">
                                                    {format(
                                                        new Date(event.date),
                                                        "MMM dd, yyyy",
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {event.event}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {event.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>

                            {/* Export buttons */}
                            <div className="flex gap-2 justify-end border-t pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        handleExportElection(
                                            detailQuery.data.election_id,
                                            "csv",
                                        )
                                    }
                                >
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Export CSV
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        handleExportElection(
                                            detailQuery.data.election_id,
                                            "pdf",
                                        )
                                    }
                                >
                                    <FileJson className="w-4 h-4 mr-2" />
                                    Export PDF
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">
                            Failed to load election details
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ElectionRecords;
