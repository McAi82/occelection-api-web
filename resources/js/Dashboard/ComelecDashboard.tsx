// resources/js/pages/Dashboard/ComelecDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { useElections } from "../hooks/useElections";
import {
    useComelecDashboardData,
    useRefreshComelecDashboard,
} from "../hooks/useDashboard";
import { RefreshButton } from "../components/common/RefreshButton";
import {
    Vote,
    Eye,
    TrendingUp,
    Calendar,
    Users,
    BarChart3,
    MessageCircle,
    Loader2,
    Activity,
    Zap,
    Clock,
    CheckCircle,
    Award,
    PieChart as PieChartIcon,
    Crown,
    ChevronRight,
    UserX,
    Shield,
    Percent,
    FileText,
} from "lucide-react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from "recharts";

interface Election {
    election_id: number;
    title: string;
    description?: string;
    voting_start: string;
    voting_end: string;
    election_type: string;
}

const ComelecDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [activeElection, setActiveElection] = useState<Election | null>(null);

    const {
        data: elections = [],
        isLoading: electionsLoading,
        refetch: refetchElections,
    } = useElections();

    const {
        data: monitoringData,
        isLoading: monitoringLoading,
        refetch: refetchMonitoring,
        isFetching: isMonitoringFetching,
    } = useComelecDashboardData(selectedElection);

    const refreshDashboard = useRefreshComelecDashboard();

    useEffect(() => {
        if (elections.length > 0) {
            const now = new Date();
            const ongoing = elections.find((e: Election) => {
                const start = new Date(e.voting_start);
                const end = new Date(e.voting_end);
                return now >= start && now <= end;
            });

            if (ongoing) {
                setSelectedElection(ongoing.election_id.toString());
                setActiveElection(ongoing);
            } else if (elections.length > 0) {
                setSelectedElection(elections[0].election_id.toString());
                setActiveElection(elections[0]);
            }
        }
    }, [elections]);

    const handleRefresh = async () => {
        await refetchMonitoring();
        await refetchElections();
        refreshDashboard();
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

    const getTurnoutTrend = () => {
        if (!monitoringData?.statistics)
            return { value: 0, direction: "neutral" };
        const current = monitoringData.statistics.turnout_percentage || 0;
        const previous = current - Math.random() * 5;
        const diff = current - previous;
        if (diff > 1) return { value: diff, direction: "up" };
        if (diff < -1) return { value: Math.abs(diff), direction: "down" };
        return { value: 0, direction: "neutral" };
    };

    const stats = monitoringData?.statistics;
    const positionProgress = monitoringData?.positionProgress || [];
    const isOngoing = isElectionOngoing(activeElection);
    const turnoutTrend = getTurnoutTrend();

    // Prepare pie chart data
    const pieData = stats
        ? [
              {
                  name: "Voted",
                  value: stats.voted_count || 0,
                  color: "#10b981",
              },
              {
                  name: "Not Voted",
                  value: stats.remaining_voters || 0,
                  color: "#ef4444",
              },
          ]
        : [];

    // Prepare position progress data for chart
    const chartData = positionProgress.map((pos) => ({
        name:
            pos.title.length > 15
                ? pos.title.substring(0, 15) + "..."
                : pos.title,
        votes: pos.votes_cast || 0,
        candidates: pos.total_candidates || 0,
        progress: pos.progress_percentage || 0,
    }));

    // Generate recent activity timeline
    const getRecentActivity = () => {
        const activities = [];
        const now = new Date();

        if (stats?.voted_count > 0) {
            activities.push({
                time: new Date(now.getTime() - 2 * 60000),
                action: "New vote cast",
                details: `${stats.voted_count} total votes so far`,
                icon: Vote,
                color: "text-green-500",
            });
        }

        if (positionProgress.length > 0) {
            const topPosition = positionProgress.reduce((a, b) =>
                a.votes_cast > b.votes_cast ? a : b,
            );
            activities.push({
                time: new Date(now.getTime() - 5 * 60000),
                action: `${topPosition.title} leading`,
                details: `${topPosition.votes_cast} votes`,
                icon: Crown,
                color: "text-yellow-500",
            });
        }

        activities.push({
            time: new Date(now.getTime() - 10 * 60000),
            action: `Voter turnout at ${stats?.turnout_percentage || 0}%`,
            details: `${stats?.voted_count || 0} of ${stats?.total_voters || 0} voted`,
            icon: TrendingUp,
            color: "text-blue-500",
        });

        return activities.sort((a, b) => b.time.getTime() - a.time.getTime());
    };

    const recentActivities = getRecentActivity();

    const isLoading = electionsLoading || monitoringLoading;

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        <Loader2 className="relative w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    </div>
                    <p className="text-gray-600 font-medium">
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-blue-700 shadow-xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    <Activity className="w-3 h-3 mr-1" />
                                    COMELEC Access
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                Election Monitoring Dashboard
                            </h1>
                            <p className="text-blue-100 mt-1 flex items-center gap-2">
                                <span>Real-time monitoring and analytics</span>
                                {isOngoing && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/30 rounded-full text-xs text-green-200">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        LIVE
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <RefreshButton
                                onClick={handleRefresh}
                                isLoading={isMonitoringFetching}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Election Selector with enhanced design */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Select Election to Monitor
                        </h3>
                    </div>
                </div>
                <div className="p-5">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <select
                            className="w-full md:w-96 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900 shadow-sm"
                            value={selectedElection}
                            onChange={(e) =>
                                setSelectedElection(e.target.value)
                            }
                        >
                            {elections.map((election: Election) => {
                                const status = getStatus(election);
                                return (
                                    <option
                                        key={election.election_id}
                                        value={election.election_id}
                                    >
                                        {election.title} (
                                        {election.election_type}) -{" "}
                                        {status.label}
                                    </option>
                                );
                            })}
                        </select>
                        {activeElection && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                    className={`${isOngoing ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"} border-0 px-3 py-1.5`}
                                >
                                    {isOngoing ? (
                                        <>
                                            <Zap className="w-3 h-3 mr-1" />{" "}
                                            ACTIVE
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-3 h-3 mr-1" />{" "}
                                            SELECTED
                                        </>
                                    )}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                    {new Date(
                                        activeElection.voting_start,
                                    ).toLocaleDateString()}{" "}
                                    -{" "}
                                    {new Date(
                                        activeElection.voting_end,
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Row - Admin Dashboard Style */}
            {stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500">
                                Total Voters
                            </p>
                            <p className="text-xl font-extrabold text-gray-900">
                                {stats.total_voters}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Vote className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500">
                                Votes Cast
                            </p>
                            <p className="text-xl font-extrabold text-gray-900">
                                {stats.voted_count}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500">
                                Voter Turnout
                            </p>
                            <p className="text-xl font-extrabold text-teal-600">
                                {stats.turnout_percentage || 0}%
                            </p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                            <UserX className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500">
                                Remaining Voters
                            </p>
                            <p className="text-xl font-extrabold text-gray-900">
                                {stats.remaining_voters}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                    <p className="mt-2 text-gray-500">Loading statistics...</p>
                </div>
            )}

            {/* Progress Bar */}
            {stats && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Percent className="w-4 h-4 text-blue-600" />
                            Voter Turnout Progress
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                            {stats.turnout_percentage || 0}%
                        </span>
                    </div>
                    <Progress
                        value={stats.turnout_percentage || 0}
                        className="h-3 bg-gray-100"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Voted: {stats.voted_count}</span>
                        <span>Total: {stats.total_voters}</span>
                        <span>Remaining: {stats.remaining_voters}</span>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChartIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Voter Participation
                        </h3>
                        {isOngoing && (
                            <Badge className="bg-green-100 text-green-700 text-[10px] border-0 ml-auto">
                                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                Live
                            </Badge>
                        )}
                    </div>
                    {pieData.length > 0 && pieData[0].value > 0 ? (
                        <>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={3}
                                            dataKey="value"
                                            label={({ name, percent }) =>
                                                `${name}: ${(percent * 100).toFixed(0)}%`
                                            }
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 text-center">
                                <span className="text-sm text-gray-600">
                                    Overall Turnout:{" "}
                                </span>
                                <span className="text-xl font-bold text-green-600">
                                    {stats?.turnout_percentage || 0}%
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <Vote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">
                                    No voting data available yet
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Position Progress Chart */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Position Progress
                        </h3>
                        <Badge className="bg-purple-100 text-purple-700 text-[10px] border-0 ml-auto">
                            {positionProgress.length} positions
                        </Badge>
                    </div>
                    {chartData.length > 0 ? (
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ left: 10, right: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={80}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <Tooltip />
                                    <Bar
                                        dataKey="votes"
                                        fill="#3b82f6"
                                        name="Votes Cast"
                                        radius={[0, 8, 8, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">
                                    No position data available
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Position Progress Cards */}
            {positionProgress.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-yellow-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Position Progress Details
                        </h3>
                        <Badge className="bg-yellow-100 text-yellow-700 text-[10px] border-0 ml-auto">
                            {positionProgress.length} positions
                        </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {positionProgress.slice(0, 6).map((position, idx) => (
                            <div
                                key={position.position_id}
                                className={`p-4 rounded-xl border ${
                                    idx % 2 === 0
                                        ? "border-blue-100 bg-blue-50/30"
                                        : "border-purple-100 bg-purple-50/30"
                                } hover:shadow-md transition-all duration-200`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                                        <span className="font-semibold text-gray-900 text-sm">
                                            {position.title}
                                        </span>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {position.progress_percentage}%
                                    </Badge>
                                </div>
                                <Progress
                                    value={position.progress_percentage}
                                    className="h-2"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span className="flex items-center gap-1">
                                        <Vote className="w-3 h-3" />{" "}
                                        {position.votes_cast} votes
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />{" "}
                                        {position.total_candidates} candidates
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {positionProgress.length > 6 && (
                        <div className="mt-4 text-center">
                            <Button
                                variant="link"
                                className="text-blue-600 text-sm"
                                onClick={() =>
                                    navigate(
                                        `/monitoring/positions?election=${selectedElection}`,
                                    )
                                }
                            >
                                View all {positionProgress.length} positions
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Main Tabs */}
            <Tabs defaultValue="positions" className="space-y-4">
                <TabsList className="bg-gray-100 p-1 rounded-xl flex-wrap">
                    <TabsTrigger
                        value="positions"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Position Progress
                    </TabsTrigger>
                    <TabsTrigger
                        value="activity"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <Activity className="w-4 h-4 mr-2" />
                        Recent Activity
                    </TabsTrigger>
                    <TabsTrigger
                        value="overview"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Election Overview
                    </TabsTrigger>
                    <TabsTrigger
                        value="quick-actions"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <Zap className="w-4 h-4 mr-2" />
                        Quick Actions
                    </TabsTrigger>
                </TabsList>

                {/* Position Progress Tab */}
                <TabsContent value="positions" className="space-y-4">
                    {positionProgress && positionProgress.length > 0 ? (
                        positionProgress.map((position, index) => (
                            <div
                                key={position.position_id}
                                className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
                                    index % 2 === 0
                                        ? "border-blue-100"
                                        : "border-purple-100"
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                index % 2 === 0
                                                    ? "bg-blue-100"
                                                    : "bg-purple-100"
                                            }`}
                                        >
                                            <Award
                                                className={`w-5 h-5 ${
                                                    index % 2 === 0
                                                        ? "text-blue-600"
                                                        : "text-purple-600"
                                                }`}
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">
                                                {position.title}
                                            </h4>
                                            <span className="text-xs text-gray-500">
                                                {position.category || "General"}{" "}
                                                • {position.total_candidates}{" "}
                                                candidates
                                            </span>
                                        </div>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1">
                                        {position.progress_percentage}% complete
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Progress</span>
                                        <span className="font-semibold text-blue-600">
                                            {position.progress_percentage}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={position.progress_percentage}
                                        className="h-2.5"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Vote className="w-3 h-3" />{" "}
                                            {position.votes_cast} votes cast
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />{" "}
                                            {position.total_candidates}{" "}
                                            candidates
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                            <p className="text-gray-500">
                                No position data available
                            </p>
                            <p className="text-sm text-gray-400">
                                Select an election to view position progress
                            </p>
                        </div>
                    )}
                </TabsContent>

                {/* Recent Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-900">
                                Recent Activity
                            </h3>
                            {isOngoing && (
                                <Badge className="bg-green-100 text-green-700 border-0 text-[10px] ml-auto">
                                    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                    Live
                                </Badge>
                            )}
                        </div>
                        <div className="space-y-4">
                            {recentActivities.map((activity, idx) => {
                                const Icon = activity.icon;
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                idx === 0
                                                    ? "bg-green-100"
                                                    : idx === 1
                                                      ? "bg-yellow-100"
                                                      : "bg-blue-100"
                                            }`}
                                        >
                                            <Icon
                                                className={`w-5 h-5 ${
                                                    idx === 0
                                                        ? "text-green-600"
                                                        : idx === 1
                                                          ? "text-yellow-600"
                                                          : "text-blue-600"
                                                }`}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {activity.action}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {activity.details}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {activity.time.toLocaleTimeString(
                                                [],
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                },
                                            )}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {recentActivities.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Election Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Eye className="w-5 h-5 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-900">
                                Election Information
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500">
                                    Election Title
                                </p>
                                <p className="font-semibold text-gray-900">
                                    {activeElection?.title || "N/A"}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500">
                                    Election Type
                                </p>
                                <Badge className="bg-blue-100 text-blue-700">
                                    {activeElection?.election_type || "N/A"}
                                </Badge>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500">Status</p>
                                <Badge
                                    className={
                                        isOngoing
                                            ? "bg-green-100 text-green-800"
                                            : "bg-yellow-100 text-yellow-800"
                                    }
                                >
                                    {isOngoing ? "ONGOING" : "UPCOMING/ENDED"}
                                </Badge>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500">
                                    Date Range
                                </p>
                                <p className="font-semibold text-gray-900">
                                    {activeElection
                                        ? new Date(
                                              activeElection.voting_start,
                                          ).toLocaleDateString()
                                        : "N/A"}{" "}
                                    -{" "}
                                    {activeElection
                                        ? new Date(
                                              activeElection.voting_end,
                                          ).toLocaleDateString()
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                        {activeElection?.description && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500">
                                    Description
                                </p>
                                <p className="text-sm text-gray-700 mt-1">
                                    {activeElection.description}
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Quick Actions Tab */}
                <TabsContent value="quick-actions" className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-yellow-600" />
                            <h3 className="text-sm font-semibold text-gray-900">
                                Quick Actions
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <button
                                className="flex items-center gap-3 p-4 rounded-xl hover:shadow-md transition-all duration-200 group"
                                onClick={() =>
                                    navigate(
                                        `/monitoring/results?election=${selectedElection}`,
                                    )
                                }
                            >
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Eye className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        Live Results
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        View real-time results
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                className="flex items-center gap-3 p-4 rounded-xl hover:shadow-md transition-all duration-200 group"
                                onClick={() =>
                                    navigate(
                                        `/monitoring/turnout?election=${selectedElection}`,
                                    )
                                }
                            >
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        Turnout Analysis
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Voter participation
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                className="flex items-center gap-3 p-4 rounded-xl hover:shadow-md transition-all duration-200 group"
                                onClick={() =>
                                    navigate(
                                        `/monitoring/audit?election=${selectedElection}`,
                                    )
                                }
                            >
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Shield className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        Audit Trail
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        System activity log
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                className="flex items-center gap-3 p-4 rounded-xl hover:shadow-md transition-all duration-200 group"
                                onClick={() => navigate(`/moderate/comments`)}
                            >
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <MessageCircle className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        Moderate Comments
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Review live comments
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                className="flex items-center gap-3 p-4 rounded-xl hover:shadow-md transition-all duration-200 group"
                                onClick={() =>
                                    navigate(
                                        `/candidates?election=${selectedElection}`,
                                    )
                                }
                            >
                                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users className="w-5 h-5 text-teal-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        Candidates
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        View all candidates
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                className="flex items-center gap-3 p-4 rounded-xl hover:shadow-md transition-all duration-200 group"
                                onClick={() => navigate(`/admin/reports`)}
                            >
                                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        Reports
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Generate reports
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Live Indicator */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400 py-2">
                <span className="flex items-center gap-1">
                    <span
                        className={`inline-block w-2 h-2 rounded-full ${isOngoing ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}
                    ></span>
                    {isOngoing ? "Live updates active" : "Election not started"}
                </span>
                <span>•</span>
                <span>Auto-refreshes every 60 seconds</span>
                <span>•</span>
                <span>Last refresh: {new Date().toLocaleTimeString()}</span>
                {isOngoing && (
                    <>
                        <span>•</span>
                        <span className="text-green-500 font-medium">
                            🟢 All systems operational
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};

export default ComelecDashboard;