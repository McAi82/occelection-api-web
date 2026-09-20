// resources/js/pages/Monitoring/MonitoringResults.tsx
import React, { useState, useEffect } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { monitoringAPI } from "../api/monitoring";
import { electionAPI } from "../api/elections";
import type { Election as ApiElection } from "../types";
import { useNavigate } from "react-router-dom";
import {
    Users, Vote, Trophy, RefreshCw, Loader2, BarChart3, Award,
    TrendingUp, Clock, Crown, Medal, Star, ChevronRight, Calendar,
    Target, Activity, CheckCircle, Filter,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface CandidateResult { candidate_id: number; candidate_name: string; partylist: string; votes: number; }
interface PositionResult { position_id: number; position_title: string; category: string; candidates: CandidateResult[]; total_votes: number; }
interface LiveResultsData {
    results: PositionResult[];
    summary: { total_votes_cast: number; total_voters: number; turnout_percentage: number; };
    is_ongoing: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const POLL_INTERVAL_MS = 15_000;
const HIDDEN_MULTIPLIER = 4;

const MonitoringResults: React.FC = () => {
    const [allElections, setAllElections] = useState<ApiElection[]>([]);
    const [selectedElectionId, setSelectedElectionId] = useState<string>("");
    const [selectedElection, setSelectedElection] = useState<ApiElection | null>(null);
    const [liveResults, setLiveResults] = useState<LiveResultsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
    const navigate = useNavigate();

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
            fetchLiveResults();
        }
    }, [selectedElectionId]);

    // ---------- Polling ----------
    useEffect(() => {
        if (!selectedElectionId) return;
        const tick = async () => {
            await fetchLiveResults();
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

    const fetchLiveResults = async (): Promise<void> => {
        if (!selectedElectionId) return;
        try {
            const response = await monitoringAPI.getLiveResults(selectedElectionId);
            const data = response.data;
            if (data) {
                let resultsArray: PositionResult[] = [];
                if (Array.isArray(data.results)) {
                    resultsArray = data.results;
                } else if (data.results && typeof data.results === "object") {
                    resultsArray = Object.values(data.results).map((positionCandidates: any, index: number) => {
                        const positionTitle = Object.keys(data.results)[index];
                        return {
                            position_id: index,
                            position_title: positionTitle,
                            category: "Other",
                            candidates: Array.isArray(positionCandidates) ? positionCandidates : [],
                            total_votes: Array.isArray(positionCandidates)
                                ? positionCandidates.reduce((sum: number, c: any) => sum + c.votes, 0)
                                : 0,
                        };
                    });
                }
                const transformedData: LiveResultsData = {
                    results: resultsArray,
                    summary: {
                        total_votes_cast: data.summary?.total_votes_cast || 0,
                        total_voters: data.summary?.total_voters || 0,
                        turnout_percentage: data.summary?.turnout_percentage || 0,
                    },
                    is_ongoing: data.is_ongoing || false,
                };
                setLiveResults(transformedData);
                if (resultsArray.length > 0 && !selectedPosition) setSelectedPosition(resultsArray[0].position_title);
            } else {
                setLiveResults(null);
            }
            setLastRefresh(new Date());
            setError("");
        } catch (error) {
            console.error("Failed to fetch live results:", error);
            setError("Failed to load live results");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const refreshData = async (): Promise<void> => {
        setRefreshing(true);
        await fetchLiveResults();
    };

    const getMaxVotes = (candidates: CandidateResult[]): number => {
        if (!candidates || candidates.length === 0) return 0;
        return Math.max(...candidates.map((c) => c.votes));
    };

    const getWinnerBadge = (index: number, isOngoing: boolean) => {
        if (isOngoing) {
            if (index === 0) return { icon: TrendingUp, label: "Leading", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
            return null;
        }
        if (index === 0) return { icon: Crown, label: "Winner", color: "bg-amber-100 text-amber-800 border-amber-200" };
        if (index === 1) return { icon: Medal, label: "1st Runner Up", color: "bg-gray-100 text-gray-800 border-gray-200" };
        if (index === 2) return { icon: Star, label: "2nd Runner Up", color: "bg-orange-100 text-orange-800 border-orange-200" };
        return null;
    };

    const getElectionStatus = (election: ApiElection) => {
        const now = new Date();
        const start = new Date(election.voting_start);
        const end = new Date(election.voting_end);
        if (now < start) return { label: "Upcoming", color: "bg-yellow-100 text-yellow-800", icon: Clock };
        if (now > end) return { label: "Ended", color: "bg-gray-100 text-gray-800", icon: CheckCircle };
        return { label: "Ongoing", color: "bg-green-100 text-green-800", icon: Activity };
    };

    const selectedPositionData = liveResults?.results.find((p) => p.position_title === selectedPosition);

    if (loading && !allElections.length) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading results...</p>
                </div>
            </div>
        );
    }

    if (!allElections.length) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Elections Found</h2>
                <p className="text-gray-500">No elections are available for monitoring.</p>
            </div>
        );
    }

    const isOngoing = liveResults?.is_ongoing;
    const selectedElectionData = allElections.find((e) => e.election_id.toString() === selectedElectionId);
    const electionStatus = selectedElectionData ? getElectionStatus(selectedElectionData) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-700 shadow-xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Trophy className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    {isOngoing ? "Live Results" : "Final Results"}
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                {isOngoing ? "Live Election Results" : "Election Results"}
                            </h1>
                            <p className="text-blue-100 mt-1 flex items-center gap-2">
                                <span>Real-time voting results for {selectedElectionData?.title || "Election"}</span>
                                {isOngoing && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/30 rounded-full text-xs text-green-200">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        LIVE
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={`${isOngoing ? "bg-green-500 animate-pulse" : "bg-purple-500"} text-white px-4 py-1.5`}>
                                {isOngoing ? "LIVE" : "FINAL"}
                            </Badge>
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
                        <h3 className="text-sm font-semibold text-gray-900">Select Election</h3>
                    </div>
                </div>
                <div className="p-5">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <select
                            className="w-full md:w-96 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900 shadow-sm"
                            value={selectedElectionId}
                            onChange={(e) => { setSelectedElectionId(e.target.value); setSelectedPosition(null); }}
                        >
                            {allElections.map((election) => {
                                const status = getElectionStatus(election);
                                return (<option key={election.election_id} value={election.election_id}>{election.title} ({election.election_type}) - {status.label}</option>);
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

            {/* Summary stats */}
            {liveResults?.summary && (
                <div className="flex flex-wrap items-center gap-3 py-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                        <Vote className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Total Votes</span>
                        <span className="text-sm font-bold text-blue-600">{liveResults.summary.total_votes_cast}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Total Voters</span>
                        <span className="text-sm font-bold text-green-800">{liveResults.summary.total_voters}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Turnout</span>
                        <span className="text-sm font-bold text-purple-800">{liveResults.summary.turnout_percentage}%</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full">
                        <Target className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Positions</span>
                        <span className="text-sm font-bold text-orange-800">{liveResults.results.length}</span>
                    </div>
                </div>
            )}

            {/* Progress bar */}
            {liveResults?.summary && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-600" />
                            Voting Progress
                        </span>
                        <span className="text-sm font-bold text-green-600">{liveResults.summary.turnout_percentage}% Complete</span>
                    </div>
                    <Progress value={liveResults.summary.turnout_percentage} className="h-3 bg-gray-100" />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Votes Cast: {liveResults.summary.total_votes_cast}</span>
                        <span>Total Voters: {liveResults.summary.total_voters}</span>
                        <span>Remaining: {liveResults.summary.total_voters - liveResults.summary.total_votes_cast}</span>
                    </div>
                </div>
            )}

            {/* Position selector */}
            {liveResults?.results && liveResults.results.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-900">Select Position</h3>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {liveResults.results.map((position) => (
                                <button
                                    key={position.position_id}
                                    onClick={() => setSelectedPosition(position.position_title)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        selectedPosition === position.position_title ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {position.position_title}
                                    <Badge className={`ml-2 ${selectedPosition === position.position_title ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                                        {position.candidates.length}
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Selected position results */}
            {selectedPositionData && liveResults?.results && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{selectedPositionData.position_title}</h3>
                                    <span className="text-sm text-gray-500">{selectedPositionData.category}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs">{selectedPositionData.candidates.length} Candidates</Badge>
                                <Badge variant="outline" className="text-xs">{selectedPositionData.total_votes} Total Votes</Badge>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-6">
                            {selectedPositionData.candidates.map((candidate, idx) => {
                                const maxVotes = getMaxVotes(selectedPositionData.candidates);
                                const percentage = maxVotes > 0 ? (candidate.votes / maxVotes) * 100 : 0;
                                const winnerBadge = getWinnerBadge(idx, isOngoing ?? false);
                                return (
                                    <div key={candidate.candidate_id} className="space-y-2">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${idx === 0 ? "bg-amber-500" : "bg-gray-500"}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">{candidate.candidate_name}</span>
                                                    {candidate.partylist && candidate.partylist !== "Independent" && (
                                                        <span className="text-sm text-gray-500 ml-2">({candidate.partylist})</span>
                                                    )}
                                                </div>
                                                {winnerBadge && (
                                                    <Badge className={winnerBadge.color}>
                                                        <winnerBadge.icon className="w-3 h-3 mr-1" />
                                                        {winnerBadge.label}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-xl text-gray-900">{candidate.votes}</span>
                                                <span className="text-sm text-gray-500">votes</span>
                                                <span className="text-sm text-gray-500 w-12 text-right">{Math.round(percentage)}%</span>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Progress value={percentage} className={`h-3 ${idx === 0 ? "bg-amber-100" : "bg-gray-100"}`} />
                                            {idx === 0 && (
                                                <div className="absolute -top-1 right-0">
                                                    <Crown className="w-4 h-4 text-yellow-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {selectedPositionData.candidates.length > 1 && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 className="w-5 h-5 text-purple-600" />
                                    <h4 className="text-sm font-semibold text-gray-900">Vote Distribution</h4>
                                </div>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={selectedPositionData.candidates} layout="vertical" margin={{ left: 10, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="candidate_name" type="category" width={120} tick={{ fontSize: 10 }} />
                                            <Tooltip />
                                            <Bar dataKey="votes" fill="#3b82f6" name="Votes" radius={[0, 8, 8, 0]}>
                                                {selectedPositionData.candidates.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Other positions */}
            {liveResults?.results && liveResults.results.length > 1 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">All Positions Overview</h3>
                        <Badge className="bg-blue-100 text-blue-700 text-[10px] border-0 ml-auto">{liveResults.results.length} positions</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {liveResults.results
                            .filter((p) => p.position_title !== selectedPosition)
                            .slice(0, 5)
                            .map((position) => {
                                const leader = position.candidates.length > 0 ? position.candidates[0] : null;
                                return (
                                    <div
                                        key={position.position_id}
                                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => setSelectedPosition(position.position_title)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-900 text-sm">{position.position_title}</h4>
                                            <Badge variant="outline" className="text-xs">{position.candidates.length} candidates</Badge>
                                        </div>
                                        {leader && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Leading: {leader.candidate_name}</span>
                                                <span className="font-bold text-blue-600">{leader.votes} votes</span>
                                            </div>
                                        )}
                                        <div className="mt-2 text-xs text-gray-400">Total votes: {position.total_votes}</div>
                                    </div>
                                );
                            })}
                    </div>
                    {liveResults.results.length > 6 && (
                        <div className="mt-4 text-center">
                            <Button variant="link" className="text-blue-600 text-sm" onClick={() => navigate(`/monitoring/positions?election=${selectedElection}`)}>
                                View all {liveResults.results.length} positions
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MonitoringResults;