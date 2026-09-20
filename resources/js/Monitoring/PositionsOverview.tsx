// resources/js/pages/Monitoring/PositionsOverview.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Card,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Input } from "../components/ui/input";
import { monitoringAPI } from "../api/monitoring";
import { electionAPI } from "../api/elections";
import { RefreshButton } from "../components/common/RefreshButton";
import {
    Award,
    Users,
    Vote,
    Search,
    Filter,
    Loader2,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    List,
    TrendingUp,
    ArrowUp,
    ArrowDown,
    Eye,
    BarChart3,
    Sparkles,
    Clock,
    CheckCircle,
    AlertCircle,
    Calendar,
    Activity,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface Election {
    election_id: number;
    title: string;
    voting_start: string;
    voting_end: string;
    election_type: string;
}

interface PositionProgress {
    position_id: number;
    title: string;
    total_candidates: number;
    votes_cast: number;
    progress_percentage: number;
    category?: string;
}

interface Stats {
    total_voters: number;
    voted_count: number;
    turnout_percentage: number;
    remaining_voters: number;
}

interface MonitoringData {
    statistics: Stats;
    positionProgress: PositionProgress[];
    recent_activity: {
        last_30_minutes: number;
    };
}

type ViewMode = "list" | "grid";
type SortField = "votes" | "progress" | "candidates" | "title";
type SortOrder = "asc" | "desc";

const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
];

const PositionsOverview: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const electionIdFromUrl = searchParams.get("election");

    const [elections, setElections] = useState<Election[]>([]);
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [sortField, setSortField] = useState<SortField>("votes");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchElections();
    }, []);

    useEffect(() => {
        if (elections.length > 0 && !selectedElection) {
            if (
                electionIdFromUrl &&
                elections.find(
                    (e) => e.election_id.toString() === electionIdFromUrl,
                )
            ) {
                setSelectedElection(electionIdFromUrl);
            } else {
                setSelectedElection(elections[0].election_id.toString());
            }
        }
    }, [elections, electionIdFromUrl]);

    useEffect(() => {
        if (selectedElection) {
            fetchMonitoringData();
        }
    }, [selectedElection]);

    const fetchElections = async () => {
        try {
            const response = await electionAPI.getAll();
            const data = Array.isArray(response.data) ? response.data : [];
            setElections(data);
        } catch (error) {
            console.error("Failed to fetch elections:", error);
            setError("Failed to load elections");
        }
    };

    const fetchMonitoringData = async () => {
        if (!selectedElection) return;
        setLoading(true);
        setError("");
        try {
            const response = await monitoringAPI.getDashboard(selectedElection);
            const data = response.data;

            if (data) {
                const transformedData: MonitoringData = {
                    statistics: {
                        total_voters: data.statistics?.total_voters || 0,
                        voted_count: data.statistics?.voted_count || 0,
                        turnout_percentage:
                            data.statistics?.turnover_percentage ||
                            data.statistics?.turnout_percentage ||
                            0,
                        remaining_voters:
                            data.statistics?.remaining_voters || 0,
                    },
                    positionProgress: data.position_progress || [],
                    recent_activity: {
                        last_30_minutes:
                            data.recent_activity?.last_30_minutes || 0,
                    },
                };
                setMonitoringData(transformedData);
            }
        } catch (error: any) {
            console.error("Failed to fetch monitoring data:", error);
            setError(error.response?.data?.message || "Failed to load data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchMonitoringData();
        setRefreshing(false);
    };

    const getStatus = (election: Election) => {
        const now = new Date();
        const start = new Date(election.voting_start);
        const end = new Date(election.voting_end);

        if (now < start) {
            return {
                label: "Upcoming",
                color: "bg-yellow-100 text-yellow-800",
                icon: Clock,
            };
        }
        if (now > end) {
            return {
                label: "Ended",
                color: "bg-gray-100 text-gray-800",
                icon: CheckCircle,
            };
        }
        return {
            label: "Ongoing",
            color: "bg-green-100 text-green-800",
            icon: Activity,
        };
    };

    const isElectionOngoing = (election: Election | null) => {
        if (!election) return false;
        const now = new Date();
        const start = new Date(election.voting_start);
        const end = new Date(election.voting_end);
        return now >= start && now <= end;
    };

    // Filter and sort positions
    const filteredPositions = useMemo(() => {
        let positions = monitoringData?.positionProgress || [];

        // Filter by search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            positions = positions.filter(
                (p) =>
                    p.title.toLowerCase().includes(term) ||
                    (p.category && p.category.toLowerCase().includes(term)),
            );
        }

        // Filter by category
        if (categoryFilter !== "all") {
            positions = positions.filter((p) => p.category === categoryFilter);
        }

        // Sort
        positions = [...positions].sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case "votes":
                    comparison = a.votes_cast - b.votes_cast;
                    break;
                case "progress":
                    comparison = a.progress_percentage - b.progress_percentage;
                    break;
                case "candidates":
                    comparison = a.total_candidates - b.total_candidates;
                    break;
                case "title":
                    comparison = a.title.localeCompare(b.title);
                    break;
                default:
                    comparison = a.votes_cast - b.votes_cast;
            }
            return sortOrder === "desc" ? -comparison : comparison;
        });

        return positions;
    }, [
        monitoringData?.positionProgress,
        searchTerm,
        categoryFilter,
        sortField,
        sortOrder,
    ]);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        monitoringData?.positionProgress.forEach((p) => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats);
    }, [monitoringData?.positionProgress]);

    // Pagination
    const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
    const paginatedPositions = filteredPositions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null;
        return sortOrder === "asc" ? (
            <ArrowUp className="w-3 h-3" />
        ) : (
            <ArrowDown className="w-3 h-3" />
        );
    };

    // Get max votes for chart
    const maxVotes = useMemo(() => {
        return Math.max(...filteredPositions.map((p) => p.votes_cast), 0);
    }, [filteredPositions]);

    const activeElection = elections.find(
        (e) => e.election_id.toString() === selectedElection,
    );
    const isOngoing = isElectionOngoing(activeElection || null);

    if (loading && !monitoringData) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                        Loading positions...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 via-indigo-600 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Positions Overview
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                All Positions
                            </h1>
                            <p className="text-blue-100 mt-1">
                                View and monitor all election positions
                                {isOngoing && (
                                    <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/30 rounded-full text-xs text-green-200">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        LIVE
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <RefreshButton
                                onClick={handleRefresh}
                                isLoading={refreshing}
                            />
                            <Button
                                variant="outline"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={() =>
                                    navigate("/monitoring/live-dashboard")
                                }
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            {monitoringData?.statistics && (
                <div className="flex flex-wrap items-center gap-3 py-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">
                            Total Positions
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                            {monitoringData.positionProgress.length}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                            Candidates
                        </span>
                        <span className="text-sm font-bold text-blue-800">
                            {monitoringData.positionProgress.reduce(
                                (sum, p) => sum + p.total_candidates,
                                0,
                            )}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                        <Vote className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            Total Votes
                        </span>
                        <span className="text-sm font-bold text-green-800">
                            {monitoringData.positionProgress.reduce(
                                (sum, p) => sum + p.votes_cast,
                                0,
                            )}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">
                            Categories
                        </span>
                        <span className="text-sm font-bold text-purple-800">
                            {categories.length}
                        </span>
                    </div>
                    {isOngoing && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-sm font-medium text-green-700">
                                Live
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Election Selector */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Select Election
                        </h3>
                    </div>
                </div>
                <div className="p-5">
                    <select
                        className="w-full md:w-96 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900 shadow-sm"
                        value={selectedElection}
                        onChange={(e) => {
                            setSelectedElection(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        {elections.map((election) => {
                            const status = getStatus(election);
                            return (
                                <option
                                    key={election.election_id}
                                    value={election.election_id}
                                >
                                    {election.title} ({election.election_type})
                                    - {status.label}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Filters & Search
                        </h3>
                    </div>
                </div>
                <div className="p-5">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search by position name or category..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10 rounded-xl bg-gray-50 border-gray-200"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900"
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm("");
                                    setCategoryFilter("all");
                                    setCurrentPage(1);
                                }}
                                className="rounded-xl"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                Showing {filteredPositions.length} of{" "}
                                {monitoringData?.positionProgress.length || 0}{" "}
                                positions
                            </span>
                            {searchTerm && (
                                <Badge variant="outline" className="text-xs">
                                    Search: "{searchTerm}"
                                </Badge>
                            )}
                            {categoryFilter !== "all" && (
                                <Badge variant="outline" className="text-xs">
                                    Category: {categoryFilter}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                        viewMode === "list"
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                    }`}
                                    onClick={() => setViewMode("list")}
                                >
                                    <List className="w-4 h-4" />
                                    List
                                </button>
                                <button
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                        viewMode === "grid"
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                    }`}
                                    onClick={() => setViewMode("grid")}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    Grid
                                </button>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                                {paginatedPositions.length} shown
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Position Chart */}
            {filteredPositions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Vote Distribution by Position
                        </h3>
                        <Badge className="bg-purple-100 text-purple-700 text-[10px] border-0 ml-auto">
                            {filteredPositions.length} positions
                        </Badge>
                    </div>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={filteredPositions.slice(0, 15)}
                                layout="vertical"
                                margin={{ left: 10, right: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis
                                    dataKey="title"
                                    type="category"
                                    width={120}
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "white",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Bar
                                    dataKey="votes_cast"
                                    fill="#3b82f6"
                                    name="Votes Cast"
                                    radius={[0, 8, 8, 0]}
                                >
                                    {filteredPositions
                                        .slice(0, 15)
                                        .map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Positions List/Grid */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                    <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {filteredPositions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                    <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Positions Found
                    </h3>
                    <p className="text-gray-500">
                        {searchTerm || categoryFilter !== "all"
                            ? "No positions match your current filters. Try adjusting your search criteria."
                            : "No positions available for this election yet."}
                    </p>
                    {(searchTerm || categoryFilter !== "all") && (
                        <Button
                            variant="link"
                            onClick={() => {
                                setSearchTerm("");
                                setCategoryFilter("all");
                                setCurrentPage(1);
                            }}
                            className="mt-4"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
            ) : viewMode === "list" ? (
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th
                                        className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                        onClick={() => handleSort("title")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Category
                                            {getSortIcon("title")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                        onClick={() => handleSort("candidates")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Candidates
                                            {getSortIcon("candidates")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                        onClick={() => handleSort("votes")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Votes
                                            {getSortIcon("votes")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                        onClick={() => handleSort("progress")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Progress
                                            {getSortIcon("progress")}
                                        </div>
                                    </th>
                                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedPositions.map((position, idx) => (
                                    <tr
                                        key={position.position_id}
                                        className={`hover:bg-blue-50/30 transition-colors ${
                                            idx % 2 === 0
                                                ? "bg-white"
                                                : "bg-gray-50/30"
                                        }`}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                        idx % 2 === 0
                                                            ? "bg-blue-100"
                                                            : "bg-purple-100"
                                                    }`}
                                                >
                                                    <Award
                                                        className={`w-4 h-4 ${
                                                            idx % 2 === 0
                                                                ? "text-blue-600"
                                                                : "text-purple-600"
                                                        }`}
                                                    />
                                                </div>
                                                <span className="font-semibold text-gray-900">
                                                    {position.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                {position.category || "General"}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium text-gray-700">
                                                {position.total_candidates}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-blue-600">
                                                {position.votes_cast}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 max-w-[150px]">
                                                <Progress
                                                    value={
                                                        position.progress_percentage
                                                    }
                                                    className="h-2 flex-1"
                                                />
                                                <span className="text-xs font-medium text-gray-600 min-w-[40px]">
                                                    {
                                                        position.progress_percentage
                                                    }
                                                    %
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() =>
                                                    navigate(
                                                        `/monitoring/results?election=${selectedElection}&position=${position.position_id}`,
                                                    )
                                                }
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedPositions.map((position, idx) => (
                        <div
                            key={position.position_id}
                            className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group ${
                                idx % 2 === 0
                                    ? "border-blue-100"
                                    : "border-purple-100"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            idx % 2 === 0
                                                ? "bg-blue-100"
                                                : "bg-purple-100"
                                        }`}
                                    >
                                        <Award
                                            className={`w-5 h-5 ${
                                                idx % 2 === 0
                                                    ? "text-blue-600"
                                                    : "text-purple-600"
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            {position.title}
                                        </h4>
                                        <span className="text-xs text-gray-500">
                                            {position.category || "General"}
                                        </span>
                                    </div>
                                </div>
                                <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                                    #{idx + 1}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Votes</span>
                                    <span className="font-bold text-blue-600">
                                        {position.votes_cast}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Candidates
                                    </span>
                                    <span className="font-medium text-gray-700">
                                        {position.total_candidates}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">
                                            Progress
                                        </span>
                                        <span className="font-semibold text-blue-600">
                                            {position.progress_percentage}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={position.progress_percentage}
                                        className="h-2"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() =>
                                        navigate(
                                            `/monitoring/results?election=${selectedElection}&position=${position.position_id}`,
                                        )
                                    }
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Details
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="text-sm text-gray-500">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                            {Math.min(
                                currentPage * itemsPerPage,
                                filteredPositions.length,
                            )}{" "}
                            of {filteredPositions.length} positions
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                disabled={currentPage === 1}
                                className="rounded-xl"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from(
                                    { length: Math.min(5, totalPages) },
                                    (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (
                                            currentPage >=
                                            totalPages - 2
                                        ) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={
                                                    currentPage === pageNum
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setCurrentPage(pageNum)
                                                }
                                                className={`min-w-[36px] rounded-xl ${
                                                    currentPage === pageNum
                                                        ? "bg-blue-600"
                                                        : ""
                                                }`}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    },
                                )}
                            </div>
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
                    </div>
                </div>
            )}

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-800">
                            About Position Monitoring
                        </h4>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1">
                            <li>
                                • Track vote progress for each position in
                                real-time
                            </li>
                            <li>
                                • View candidate count and vote distribution
                            </li>
                            <li>
                                • Sort positions by votes, progress, or
                                candidates
                            </li>
                            <li>
                                • Filter positions by category or search by name
                            </li>
                            <li>
                                • Click "View" to see detailed results for a
                                position
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PositionsOverview;
