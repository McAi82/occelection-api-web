// resources/js/pages/Monitoring/MonitoringDashboard.tsx
import React, { useState, useEffect } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { monitoringAPI } from "../api/monitoring";
import { electionAPI } from "../api/elections";
import type { Election as ApiElection } from "../types";
import {
    Users, Vote, Clock, AlertTriangle, TrendingUp, RefreshCw, Loader2,
    BarChart3, Activity, CheckCircle, PieChart as PieChartIcon,
    LineChart as LineChartIcon, Sparkles, Target, Calendar, Bell,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell, Line, Area, ComposedChart,
} from "recharts";

interface TurnoutHistoryPoint { time: string; turnout: number; votes: number; timestamp: number; }
interface PositionProgress { position_id: number; title: string; total_candidates: number; votes_cast: number; progress_percentage: number; }
interface Statistics { total_voters: number; voted_count: number; turnout_percentage: number; remaining_voters: number; }
interface RecentActivity { last_30_minutes?: number; }
interface MonitoringData {
    election_id?: number; title?: string; is_ongoing?: boolean;
    statistics: Statistics;
    position_progress: PositionProgress[];
    recent_activity: RecentActivity;
}

const renderCustomizedLabel = (props: any): string => {
    const { name, percent } = props;
    if (!name) return "";
    return `${name}: ${((percent || 0) * 100).toFixed(0)}%`;
};

// Polling interval
const POLL_INTERVAL_MS = 15_000;
const HIDDEN_MULTIPLIER = 4;

const MonitoringDashboard: React.FC = () => {
    const [allElections, setAllElections] = useState<ApiElection[]>([]);
    const [selectedElectionId, setSelectedElectionId] = useState<string>("");
    const [selectedElection, setSelectedElection] = useState<ApiElection | null>(null);
    const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
    const [turnoutHistory, setTurnoutHistory] = useState<TurnoutHistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [selectedTimeRange, setSelectedTimeRange] = useState<"30min" | "1hour" | "3hours" | "all">("30min");
    const [hasRealData, setHasRealData] = useState(false);

    useEffect(() => { fetchAllElections(); }, []);

    useEffect(() => {
        if (allElections.length > 0 && !selectedElectionId) {
            const now = new Date();
            const ongoing = allElections.find((e) => {
                const start = new Date(e.voting_start);
                const end = new Date(e.voting_end);
                return now >= start && now <= end;
            });
            if (ongoing) setSelectedElectionId(ongoing.election_id.toString());
            else setSelectedElectionId(allElections[0].election_id.toString());
        }
    }, [allElections]);

    useEffect(() => {
        if (selectedElectionId) {
            const election = allElections.find((e) => e.election_id.toString() === selectedElectionId);
            setSelectedElection(election || null);
            fetchMonitoringData();
            setTurnoutHistory([]);
            setHasRealData(false);
        }
    }, [selectedElectionId]);

    // ---------- Polling ----------
    useEffect(() => {
        if (!selectedElectionId) return;
        const tick = async () => {
            await fetchMonitoringData();
            const interval = document.hidden ? POLL_INTERVAL_MS * HIDDEN_MULTIPLIER : POLL_INTERVAL_MS;
            timer = setTimeout(tick, interval);
        };
        let timer = setTimeout(tick, POLL_INTERVAL_MS);
        return () => clearTimeout(timer);
    }, [selectedElectionId]);

    const fetchAllElections = async () => {
        try {
            const response = await electionAPI.getAll();
            const data = Array.isArray(response.data) ? response.data : [];
            setAllElections(data);
        } catch (error) {
            console.error("Failed to fetch elections:", error);
            setError("Failed to load elections");
        } finally {
            setLoading(false);
        }
    };

    const fetchMonitoringData = async () => {
        if (!selectedElectionId) return;
        try {
            const response = await monitoringAPI.getDashboard(selectedElectionId);
            const data = response.data;
            if (data) {
                const transformedData: MonitoringData = {
                    statistics: {
                        total_voters: data.statistics?.total_voters || 0,
                        voted_count: data.statistics?.voted_count || 0,
                        turnout_percentage: data.statistics?.turnover_percentage || data.statistics?.turnout_percentage || 0,
                        remaining_voters: data.statistics?.remaining_voters || 0,
                    },
                    position_progress: data.position_progress || [],
                    recent_activity: { last_30_minutes: data.recent_activity?.last_30_minutes || 0 },
                    is_ongoing: data.is_ongoing || false,
                };
                setMonitoringData(transformedData);
                if (transformedData.statistics.voted_count > 0) {
                    updateTurnoutHistory(transformedData.statistics);
                    setHasRealData(true);
                }
            }
            setLastRefresh(new Date());
            setError("");
        } catch (error) {
            console.error("Failed to fetch monitoring data:", error);
            setError("Failed to load monitoring data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const updateTurnoutHistory = (stats: Statistics) => {
        const now = Date.now();
        const newPoint: TurnoutHistoryPoint = {
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            turnout: stats.turnout_percentage || 0,
            votes: stats.voted_count || 0,
            timestamp: now,
        };
        setTurnoutHistory((prev) => {
            const twoHoursAgo = now - 120 * 60000;
            const filtered = prev.filter((p) => p.timestamp > twoHoursAgo);
            const lastPoint = filtered[filtered.length - 1];
            if (lastPoint && now - lastPoint.timestamp < 30000) {
                const updated = [...filtered];
                updated[updated.length - 1] = newPoint;
                return updated;
            }
            return [...filtered, newPoint];
        });
    };

    const refreshData = async () => {
        setRefreshing(true);
        await fetchMonitoringData();
    };

    const getFilteredHistory = (): TurnoutHistoryPoint[] => {
        const now = Date.now();
        let cutoff = 0;
        switch (selectedTimeRange) {
            case "30min": cutoff = now - 30 * 60000; break;
            case "1hour": cutoff = now - 60 * 60000; break;
            case "3hours": cutoff = now - 180 * 60000; break;
            default: cutoff = now - 120 * 60000; break;
        }
        return turnoutHistory.filter((p) => p.timestamp > cutoff);
    };

    const preparePieChartData = () => {
        if (!monitoringData?.statistics) return [];
        const voted = monitoringData.statistics.voted_count || 0;
        const notVoted = (monitoringData.statistics.total_voters || 0) - voted;
        return [
            { name: "Voted", value: voted, color: "#10b981" },
            { name: "Not Voted", value: notVoted, color: "#ef4444" },
        ];
    };

    const preparePositionProgressData = () => {
        if (!monitoringData?.position_progress) return [];
        return monitoringData.position_progress.map((pos) => ({
            name: pos.title.length > 20 ? pos.title.substring(0, 20) + "..." : pos.title,
            votes: pos.votes_cast,
            candidates: pos.total_candidates,
            progress: pos.progress_percentage,
        }));
    };

    const stats = monitoringData?.statistics;
    const isOngoing = monitoringData?.is_ongoing;
    const pieData = preparePieChartData();
    const positionProgressData = preparePositionProgressData();
    const filteredHistory = getFilteredHistory();
    const latestTurnout = filteredHistory.length > 0 ? filteredHistory[filteredHistory.length - 1].turnout : 0;

    const getElectionStatus = (election: ApiElection) => {
        const now = new Date();
        const start = new Date(election.voting_start);
        const end = new Date(election.voting_end);
        if (now < start) return { label: "Upcoming", color: "bg-yellow-100 text-yellow-800", icon: Clock };
        if (now > end) return { label: "Ended", color: "bg-gray-100 text-gray-800", icon: CheckCircle };
        return { label: "Ongoing", color: "bg-green-100 text-green-800", icon: Activity };
    };

    if (loading && !allElections.length) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading elections...</p>
                </div>
            </div>
        );
    }

    if (!allElections.length) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Elections Found</h2>
                <p className="text-gray-500">No elections are available for monitoring.</p>
            </div>
        );
    }

    const selectedElectionData = allElections.find((e) => e.election_id.toString() === selectedElectionId);
    const electionStatus = selectedElectionData ? getElectionStatus(selectedElectionData) : null;

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
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">COMELEC Dashboard</Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">Live Monitoring Dashboard</h1>
                            <p className="text-blue-100 mt-1 flex items-center gap-2">
                                <span>Real-time election monitoring and analytics</span>
                                {isOngoing && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/30 rounded-full text-xs text-green-200">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        LIVE
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={refreshData} disabled={refreshing} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Polling indicator */}
            <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-4 py-1">
                <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Auto-refreshing every 15s
                </span>
                <span>•</span>
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>

            {/* Election selector */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">Select Election to Monitor</h3>
                    </div>
                </div>
                <div className="p-5">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <select
                            className="w-full md:w-96 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900 shadow-sm"
                            value={selectedElectionId}
                            onChange={(e) => setSelectedElectionId(e.target.value)}
                        >
                            {allElections.map((election) => {
                                const status = getElectionStatus(election);
                                return (
                                    <option key={election.election_id} value={election.election_id}>
                                        {election.title} ({election.election_type}) - {status.label}
                                    </option>
                                );
                            })}
                        </select>
                        {selectedElectionData && electionStatus && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${electionStatus.color} border-0 px-3 py-1.5`}>
                                    <electionStatus.icon className="w-3 h-3 mr-1" />
                                    {electionStatus.label}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                    {new Date(selectedElectionData.voting_start).toLocaleDateString()} - {new Date(selectedElectionData.voting_end).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Election info */}
            {selectedElectionData && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">{selectedElectionData.title}</h2>
                                {isOngoing && (
                                    <Badge className="bg-green-100 text-green-700 border-0">
                                        <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                        Ongoing
                                    </Badge>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm mt-0.5">{selectedElectionData.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1.5">
                                <Vote className="w-3 h-3 mr-1" />
                                {stats?.voted_count || 0} votes
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-700 border-0 px-3 py-1.5">
                                <Users className="w-3 h-3 mr-1" />
                                {stats?.total_voters || 0} voters
                            </Badge>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats pills */}
            {stats && (
                <div className="flex flex-wrap items-center gap-3 py-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Total Voters</span>
                        <span className="text-sm font-bold text-gray-900">{stats.total_voters}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                        <Vote className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Votes Cast</span>
                        <span className="text-sm font-bold text-green-800">{stats.voted_count}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Turnout</span>
                        <span className="text-sm font-bold text-purple-800">{stats.turnout_percentage}%</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Remaining</span>
                        <span className="text-sm font-bold text-orange-800">{stats.remaining_voters}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full">
                        <span className="text-sm font-medium text-gray-600">Updated</span>
                        <span className="text-sm font-bold text-gray-700">{lastRefresh.toLocaleTimeString()}</span>
                    </div>
                </div>
            )}

            {/* Progress bar */}
            {stats && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Voter Turnout Progress</span>
                        <span className="text-sm font-bold text-blue-600">{stats.turnout_percentage}%</span>
                    </div>
                    <Progress value={stats.turnout_percentage} className="h-3" />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Voted: {stats.voted_count}</span>
                        <span>Total: {stats.total_voters}</span>
                        <span>Remaining: {stats.remaining_voters}</span>
                    </div>
                </div>
            )}

            {/* Turnout trend chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <LineChartIcon className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-gray-900">Real-time Turnout Trend</span>
                        {hasRealData && (
                            <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">
                                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                Live
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                        {["30min", "1hour", "3hours", "all"].map((range) => (
                            <button
                                key={range}
                                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                                    selectedTimeRange === range ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200"
                                }`}
                                onClick={() => setSelectedTimeRange(range as any)}
                            >
                                {range === "30min" ? "30m" : range === "1hour" ? "1h" : range === "3hours" ? "3h" : "All"}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredHistory.length > 0 && hasRealData ? (
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={filteredHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Area yAxisId="left" type="monotone" dataKey="turnout" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.08)" name="Turnout %" strokeWidth={2.5} />
                                <Line yAxisId="right" type="monotone" dataKey="votes" stroke="#10b981" name="Votes" strokeWidth={2} dot={{ r: 2, fill: "#10b981" }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[250px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No voting data available yet</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChartIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">Voter Participation</span>
                    </div>
                    {pieData.length > 0 && pieData[0].value > 0 ? (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={renderCustomizedLabel}>
                                        {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={30} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-gray-500">No voting data available yet</div>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">Position Progress</span>
                    </div>
                    {positionProgressData.length > 0 ? (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={positionProgressData} layout="vertical" margin={{ left: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="votes" fill="#3b82f6" name="Votes Cast" radius={[0, 8, 8, 0]} />
                                    <Bar dataKey="candidates" fill="#10b981" name="Candidates" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-gray-500">No position data available</div>
                    )}
                </div>
            </div>

            {/* Recent activity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-semibold text-gray-900">Recent Activity</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700">Votes in last 30 minutes</span>
                        <span className="font-bold text-green-600 text-2xl">{monitoringData?.recent_activity?.last_30_minutes || 0}</span>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">Last Updated</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700">Data refresh</span>
                        <span className="font-bold text-blue-600">{lastRefresh.toLocaleTimeString()}</span>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">Polling Status</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700">Auto-poll</span>
                        <Badge className="bg-green-100 text-green-700 border-0">
                            <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                            Active
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitoringDashboard;