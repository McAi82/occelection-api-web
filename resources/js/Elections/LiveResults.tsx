// resources/js/pages/Elections/LiveResults.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { electionAPI } from "../api/elections";
import { commentAPI } from "../api/comments";
import { adminAPI } from "../api/admin";
import { courseAPI } from "../api/courses";
import { useAuth } from "../contexts/AuthContext";
import {
    Users,
    Vote,
    RefreshCw,
    Loader2,
    BarChart3,
    Award,
    TrendingUp,
    Clock,
    MessageCircle,
    Send,
    Lock,
    EyeOff,
    Sparkles,
    ArrowLeft,
    Crown,
    PieChart as PieChartIcon,
    User,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Activity,
    UserCheck,
    Search,
    Filter,
    ChevronLeft,
    UserX,
} from "lucide-react";
import {
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface User {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface CandidateResult {
    candidate_id: number;
    candidate_name: string;
    partylist: string;
    votes: number;
    is_leading?: boolean;
    is_winner?: boolean;
}

interface Comment {
    comment_id: number;
    comment_text: string;
    is_visible: boolean;
    created_at: string;
    user?: User;
}

interface Election {
    election_id: number;
    title: string;
    voting_start: string;
    voting_end: string;
    total_voters?: number;
    election_type?: string;
    status?: string;
    is_ongoing?: boolean;
    course_id?: number;
}

interface Results {
    live_results?: Record<string, CandidateResult[]>;
    total_votes_cast?: number;
}

interface Voter {
    voter_registry_id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    student_id: string;
    email: string;
    course:
        | string
        | { course_code: string; course_name: string; course_id: number }
        | null;
    year_level: number;
    has_voted: boolean;
    voted_at: string | null;
    receipt_code?: string | null;
}

interface VoterStats {
    total: number;
    voted: number;
    notVoted: number;
    turnout: number;
}

interface Course {
    course_id: number;
    course_code: string;
    course_name: string;
}

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

interface AnonymousResult {
    position: string;
    position_id: number;
    candidates: Array<
        CandidateResult & {
            display_name: string;
            is_anonymous: boolean;
            unique_id: string;
            is_leading: boolean;
        }
    >;
    total_votes: number;
}

const getCourseDisplay = (
    course:
        | string
        | { course_code: string; course_name: string; course_id: number }
        | null,
): string => {
    if (!course) return "N/A";
    if (typeof course === "string") return course;
    if (typeof course === "object") {
        return course.course_name || course.course_code || "N/A";
    }
    return "N/A";
};

const getCourseCode = (
    course:
        | string
        | { course_code: string; course_name: string; course_id: number }
        | null,
): string => {
    if (!course) return "N/A";
    if (typeof course === "string") return course;
    if (typeof course === "object") {
        return course.course_code || "N/A";
    }
    return "N/A";
};

const LiveResults: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [results, setResults] = useState<Results | null>(null);
    const [election, setElection] = useState<Election | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [activeTab, setActiveTab] = useState("results");
    const [showAllPositions, setShowAllPositions] = useState<
        Record<string, boolean>
    >({});
    const commentsEndRef = useRef<HTMLDivElement>(null);

    const [voters, setVoters] = useState<Voter[]>([]);
    const [voterStats, setVoterStats] = useState<VoterStats | null>(null);
    const [loadingVoters, setLoadingVoters] = useState(false);
    const [voterSearch, setVoterSearch] = useState("");
    const [voterStatusFilter, setVoterStatusFilter] = useState<string>("all");
    const [voterCourseFilter, setVoterCourseFilter] = useState<string>("all");
    const [voterYearFilter, setVoterYearFilter] = useState<string>("all");
    const [courses, setCourses] = useState<Course[]>([]);
    const [voterPage, setVoterPage] = useState(1);
    const VOTERS_PER_PAGE = 20;

    const isAdmin = user?.role === "admin" || user?.role === "comelec";

    useEffect(() => {
        fetchData();
        fetchComments();
        if (isAdmin) {
            fetchVoters();
            fetchCourses();
        }
        const interval = setInterval(() => {
            fetchData();
            if (isAdmin) {
                fetchVoters();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    const scrollToBottom = (): void => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchData = async (): Promise<void> => {
        try {
            const [electionRes, resultsRes] = await Promise.all([
                electionAPI.getById(id!),
                electionAPI.getLiveResults(id!),
            ]);

            let electionData = electionRes.data;
            if (electionData?.data) {
                electionData = electionData.data;
            }
            setElection(electionData || null);
            setResults(resultsRes.data || null);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchComments = async (): Promise<void> => {
        try {
            const response = await commentAPI.getByElection(id!);
            const commentsData = response.data;
            setComments(Array.isArray(commentsData) ? commentsData : []);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        }
    };

    const fetchCourses = async (): Promise<void> => {
        try {
            const response = await courseAPI.getAll();
            const coursesData = response.data;
            setCourses(Array.isArray(coursesData) ? coursesData : []);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        }
    };

    const fetchVoters = async (): Promise<void> => {
        if (!id || !isAdmin) return;
        setLoadingVoters(true);
        try {
            const response = await adminAPI.getVoters(id);
            let data = response.data;
            if (data?.data) {
                data = data.data;
            }

            let votersData: Voter[] = [];
            let totalVoters = 0;
            let votedCount = 0;

            if (data?.voters) {
                votersData = data.voters;
                totalVoters = data.total_voters || votersData.length;
                votedCount =
                    data.voted_count ||
                    votersData.filter((v) => v.has_voted).length;
            } else if (Array.isArray(data)) {
                votersData = data;
                totalVoters = votersData.length;
                votedCount = votersData.filter((v) => v.has_voted).length;
            }

            const votersWithReceipts = await Promise.all(
                votersData.map(async (voter) => {
                    if (voter.has_voted && voter.voter_registry_id) {
                        try {
                            const receiptResponse =
                                await adminAPI.getVoterReceipt(
                                    id,
                                    voter.voter_registry_id,
                                );
                            return {
                                ...voter,
                                receipt_code:
                                    receiptResponse.data?.receipt_code || null,
                            };
                        } catch (error) {
                            return { ...voter, receipt_code: null };
                        }
                    }
                    return { ...voter, receipt_code: null };
                }),
            );

            setVoters(votersWithReceipts);
            setVoterStats({
                total: totalVoters,
                voted: votedCount,
                notVoted: totalVoters - votedCount,
                turnout:
                    totalVoters > 0
                        ? Math.round((votedCount / totalVoters) * 100)
                        : 0,
            });
        } catch (error) {
            console.error("Failed to fetch voters:", error);
        } finally {
            setLoadingVoters(false);
        }
    };

    const handleSubmitComment = async (): Promise<void> => {
        if (!newComment.trim()) return;
        if (!id) return;

        setSubmittingComment(true);
        try {
            await commentAPI.create({
                election_id: id,
                comment_text: newComment,
            });
            setNewComment("");
            fetchComments();
        } catch (error) {
            console.error("Failed to post comment:", error);
        } finally {
            setSubmittingComment(false);
        }
    };

    const getElectionStatus = (): {
        label: string;
        color: string;
        icon: React.ElementType;
    } => {
        if (!election)
            return {
                label: "Unknown",
                color: "bg-gray-100 text-gray-800",
                icon: AlertCircle,
            };

        const now = new Date();
        const start = new Date(election.voting_start);
        const end = new Date(election.voting_end);

        if (now > end) {
            return {
                label: "Ended",
                color: "bg-gray-100 text-gray-800",
                icon: CheckCircle,
            };
        }

        if (now >= start && now <= end) {
            return {
                label: "Ongoing",
                color: "bg-green-100 text-green-800",
                icon: Activity,
            };
        }

        return {
            label: "Upcoming",
            color: "bg-yellow-100 text-yellow-800",
            icon: Clock,
        };
    };

    const isElectionFinished = (): boolean => {
        if (!election) return false;
        const now = new Date();
        const end = new Date(election.voting_end);
        return now > end;
    };

    const isElectionOngoing = (): boolean => {
        if (!election) return false;
        const now = new Date();
        const start = new Date(election.voting_start);
        const end = new Date(election.voting_end);
        return now >= start && now <= end;
    };

    const toggleShowAll = (position: string): void => {
        setShowAllPositions((prev) => ({
            ...prev,
            [position]: !prev[position],
        }));
    };

    const getAnonymousResults = (): AnonymousResult[] => {
        if (!results?.live_results) return [];

        return Object.entries(results.live_results).map(
            ([position, candidates], positionIndex) => {
                const sorted = [...candidates].sort(
                    (a, b) => b.votes - a.votes,
                );
                const isFinished = isElectionFinished();

                const anonymousCandidates = sorted.map((c, candidateIndex) => ({
                    ...c,
                    display_name: isFinished
                        ? c.candidate_name
                        : `Candidate ${String.fromCharCode(65 + candidateIndex)}`,
                    is_anonymous: !isFinished,
                    unique_id: `${positionIndex}_${candidateIndex}`,
                    is_leading: candidateIndex === 0 && !isFinished,
                    is_winner: isFinished && candidateIndex === 0,
                }));

                return {
                    position,
                    position_id: positionIndex,
                    candidates: anonymousCandidates,
                    total_votes: sorted.reduce((sum, c) => sum + c.votes, 0),
                };
            },
        );
    };

    const renderCustomizedLabel = (props: any): string => {
        const { name, percent } = props;
        if (!name) return "";
        const percentage = ((percent || 0) * 100).toFixed(0);
        return `${name}: ${percentage}%`;
    };

    const getFilteredVoters = () => {
        let filtered = [...voters];

        if (voterStatusFilter === "voted") {
            filtered = filtered.filter((v) => v.has_voted);
        } else if (voterStatusFilter === "not_voted") {
            filtered = filtered.filter((v) => !v.has_voted);
        }

        if (voterCourseFilter !== "all") {
            filtered = filtered.filter((v) => {
                const courseCode = getCourseCode(v.course);
                return courseCode === voterCourseFilter;
            });
        }

        if (voterYearFilter !== "all") {
            filtered = filtered.filter(
                (v) => v.year_level === parseInt(voterYearFilter),
            );
        }

        if (voterSearch) {
            const search = voterSearch.toLowerCase();
            filtered = filtered.filter(
                (v) =>
                    v.first_name?.toLowerCase().includes(search) ||
                    v.last_name?.toLowerCase().includes(search) ||
                    v.student_id?.toLowerCase().includes(search) ||
                    v.email?.toLowerCase().includes(search),
            );
        }

        return filtered;
    };

    const filteredVoters = getFilteredVoters();
    const totalVoterPages = Math.ceil(filteredVoters.length / VOTERS_PER_PAGE);
    const paginatedVoters = filteredVoters.slice(
        (voterPage - 1) * VOTERS_PER_PAGE,
        voterPage * VOTERS_PER_PAGE,
    );

    const uniqueCourses = [
        ...new Set(voters.map((v) => getCourseCode(v.course))),
    ].filter(Boolean);

    const uniqueYears = [...new Set(voters.map((v) => v.year_level))]
        .filter((y) => y !== null && y !== undefined)
        .sort();

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        <Loader2 className="relative w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    </div>
                    <p className="text-gray-600 font-medium">
                        Loading live results...
                    </p>
                </div>
            </div>
        );
    }

    const anonymousResults = getAnonymousResults();
    const isFinished = isElectionFinished();
    const isOngoing = isElectionOngoing();
    const totalVotes = results?.total_votes_cast || 0;
    const turnout = election?.total_voters
        ? Math.round((totalVotes / election.total_voters) * 100)
        : 0;

    const electionStatus = getElectionStatus();
    const StatusIcon = electionStatus.icon;

    const pieData = anonymousResults.map((pos, idx) => ({
        name:
            pos.position.length > 15
                ? pos.position.substring(0, 15) + "..."
                : pos.position,
        value: pos.total_votes,
        color: COLORS[idx % COLORS.length],
    }));

    const showVoterTab = isAdmin && (isOngoing || isFinished);

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
            </button>

            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                <Badge
                                    className={`${electionStatus.color} border-0 px-4 py-1.5`}
                                >
                                    <StatusIcon className="w-3 h-3 mr-1.5" />
                                    {electionStatus.label}
                                </Badge>
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-white">
                                {isFinished
                                    ? "Final Election Results"
                                    : "Live Election Results"}
                            </h1>
                            <p className="text-blue-100 mt-1">
                                {election?.title}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {isOngoing && (
                                <Badge className="bg-green-500 text-white animate-pulse px-4 py-1.5">
                                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
                                    LIVE
                                </Badge>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setRefreshing(true);
                                    fetchData();
                                    if (isAdmin) fetchVoters();
                                }}
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

            {/* Anonymous Mode Notice */}
            {!isFinished && isOngoing && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <EyeOff className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-yellow-800">
                                Anonymous Results Mode
                            </p>
                            <p className="text-sm text-yellow-700">
                                Candidate names are hidden until the election
                                ends to ensure fair voting. Results shown are
                                real-time but candidate identities remain
                                anonymous.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Pills */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <Vote className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Total Votes
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {totalVotes}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        Turnout
                    </span>
                    <span className="text-sm font-bold text-green-800">
                        {turnout}%
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                        Voters
                    </span>
                    <span className="text-sm font-bold text-purple-800">
                        {election?.total_voters || 0}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">
                        Status
                    </span>
                    <span className="text-sm font-bold text-orange-800">
                        {electionStatus.label}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
            >
                <TabsList className="bg-gray-100 p-1 rounded-xl flex-wrap">
                    <TabsTrigger
                        value="results"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Results
                    </TabsTrigger>
                    <TabsTrigger
                        value="charts"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <PieChartIcon className="w-4 h-4 mr-2" />
                        Charts
                    </TabsTrigger>
                    <TabsTrigger
                        value="comments"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Live Chat (
                        {comments.filter((c) => c.is_visible).length})
                    </TabsTrigger>
                    {showVoterTab && (
                        <TabsTrigger
                            value="voters"
                            className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                        >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Voter Tracking ({voterStats?.voted || 0}/
                            {voterStats?.total || 0})
                            {isOngoing && (
                                <span className="ml-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"></span>
                            )}
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Results Tab */}
                <TabsContent value="results" className="space-y-6">
                    {anonymousResults.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BarChart3 className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">
                                No results available yet
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                Results will appear once voting begins
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {anonymousResults.map((position, idx) => {
                                const maxVotes =
                                    position.candidates[0]?.votes || 1;
                                const showAll =
                                    showAllPositions[position.position] ||
                                    false;
                                const displayCandidates = showAll
                                    ? position.candidates
                                    : position.candidates.slice(0, 5);
                                const hasMore =
                                    position.candidates.length > 5;

                                return (
                                    <div
                                        key={position.position_id}
                                        className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
                                    >
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${idx === 0 ? "bg-yellow-100" : "bg-blue-100"}`}
                                                    >
                                                        {idx === 0 ? (
                                                            <Crown className="w-4 h-4 text-yellow-600" />
                                                        ) : (
                                                            <Award className="w-4 h-4 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-gray-900">
                                                        {position.position}
                                                    </h3>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-white"
                                                >
                                                    {
                                                        position.candidates
                                                            .length
                                                    }{" "}
                                                    candidates
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            {displayCandidates.map(
                                                (
                                                    candidate,
                                                    candidateIdx,
                                                ) => {
                                                    const percentage =
                                                        (candidate.votes /
                                                            maxVotes) *
                                                        100;
                                                    const isLeading =
                                                        candidateIdx === 0 &&
                                                        !isFinished;
                                                    const isWinner =
                                                        isFinished &&
                                                        candidateIdx === 0;

                                                    return (
                                                        <div
                                                            key={
                                                                candidate.unique_id
                                                            }
                                                            className="space-y-2"
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-gray-800">
                                                                        {
                                                                            candidate.display_name
                                                                        }
                                                                    </span>
                                                                    {!isFinished &&
                                                                        candidate.is_anonymous && (
                                                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                                <Lock className="w-3 h-3" />{" "}
                                                                                Anonymous
                                                                            </span>
                                                                        )}
                                                                    {isLeading &&
                                                                        !isFinished && (
                                                                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                                                                <TrendingUp className="w-3 h-3 mr-1" />{" "}
                                                                                Leading
                                                                            </Badge>
                                                                        )}
                                                                    {isWinner &&
                                                                        isFinished && (
                                                                            <Badge className="bg-green-100 text-green-800 text-xs">
                                                                                <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                                                                Winner
                                                                            </Badge>
                                                                        )}
                                                                    {isFinished &&
                                                                        candidate.partylist !==
                                                                            "Independent" &&
                                                                        candidate.partylist && (
                                                                            <span className="text-xs text-gray-400">
                                                                                (
                                                                                {
                                                                                    candidate.partylist
                                                                                }
                                                                                )
                                                                            </span>
                                                                        )}
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-bold text-xl text-gray-900">
                                                                        {
                                                                            candidate.votes
                                                                        }
                                                                    </span>
                                                                    <span className="text-sm text-gray-500 w-12">
                                                                        {Math.round(
                                                                            percentage,
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Progress
                                                                value={
                                                                    percentage
                                                                }
                                                                className={`h-2.5 ${candidateIdx === 0 ? "bg-yellow-500" : ""}`}
                                                            />
                                                        </div>
                                                    );
                                                },
                                            )}
                                            {hasMore && (
                                                <button
                                                    onClick={() =>
                                                        toggleShowAll(
                                                            position.position,
                                                        )
                                                    }
                                                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mt-2"
                                                >
                                                    {showAll ? (
                                                        <>
                                                            <ChevronUp className="w-4 h-4" />{" "}
                                                            Show less
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4" />{" "}
                                                            Show{" "}
                                                            {position
                                                                .candidates
                                                                .length -
                                                                5}{" "}
                                                            more candidates
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <PieChartIcon className="w-5 h-5 text-blue-600" />
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Vote Distribution by Position
                                </h3>
                            </div>
                            {pieData.length > 0 && pieData[0].value > 0 ? (
                                <div className="h-[300px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={3}
                                                dataKey="value"
                                                label={renderCustomizedLabel}
                                            >
                                                {pieData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color}
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-gray-500">
                                    No chart data available
                                </div>
                            )}
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-green-600" />
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Position Rankings
                                </h3>
                            </div>
                            {anonymousResults.length > 0 ? (
                                <div className="space-y-4">
                                    {anonymousResults
                                        .slice(0, 5)
                                        .map((position, idx) => (
                                            <div
                                                key={idx}
                                                className="space-y-2"
                                            >
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-gray-700">
                                                        {position.position}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        {position.total_votes}{" "}
                                                        votes
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        (position.total_votes /
                                                            (anonymousResults[0]
                                                                ?.total_votes ||
                                                                1)) *
                                                        100
                                                    }
                                                    className="h-2"
                                                />
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-gray-500">
                                    No ranking data available
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-purple-600" />
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Live Discussion
                                </h3>
                                <Badge
                                    variant="secondary"
                                    className="bg-purple-100 text-purple-700"
                                >
                                    {
                                        comments.filter((c) => c.is_visible)
                                            .length
                                    }{" "}
                                    comments
                                </Badge>
                            </div>
                        </div>
                        <div className="h-[400px] overflow-y-auto p-4 space-y-3 bg-gray-50">
                            {comments.filter((c) => c.is_visible).length ===
                            0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">
                                        No comments yet.
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Be the first to share your thoughts!
                                    </p>
                                </div>
                            ) : (
                                comments
                                    .filter((c) => c.is_visible)
                                    .map((comment) => (
                                        <div
                                            key={comment.comment_id}
                                            className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                                        >
                                            <Avatar className="w-9 h-9 flex-shrink-0">
                                                <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                                                    {
                                                        comment.user
                                                            ?.first_name?.[0]
                                                    }
                                                    {
                                                        comment.user
                                                            ?.last_name?.[0]
                                                    }
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="font-semibold text-sm text-gray-900">
                                                            {
                                                                comment.user
                                                                    ?.first_name
                                                            }{" "}
                                                            {
                                                                comment.user
                                                                    ?.last_name
                                                            }
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(
                                                                comment.created_at,
                                                            ).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm">
                                                        {
                                                            comment.comment_text
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                            <div ref={commentsEndRef} />
                        </div>
                        <div className="border-t border-gray-200 p-4 bg-white">
                            <div className="flex gap-2">
                                <Input
                                    placeholder={
                                        isOngoing || isFinished
                                            ? "Share your thoughts about the election..."
                                            : "Comments will be enabled when the election starts"
                                    }
                                    value={newComment}
                                    onChange={(e) =>
                                        setNewComment(e.target.value)
                                    }
                                    disabled={!isOngoing && !isFinished}
                                    className="flex-1 rounded-xl"
                                    onKeyPress={(e) =>
                                        e.key === "Enter" &&
                                        handleSubmitComment()
                                    }
                                />
                                <Button
                                    onClick={handleSubmitComment}
                                    disabled={
                                        !newComment.trim() ||
                                        submittingComment ||
                                        (!isOngoing && !isFinished)
                                    }
                                    className="rounded-xl bg-purple-600 hover:bg-purple-700"
                                >
                                    {submittingComment ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                            {!isOngoing && !isFinished && (
                                <p className="text-xs text-yellow-600 text-center mt-2">
                                    Comments will be enabled when the election
                                    starts.
                                </p>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Voter Tracking Tab */}
                {showVoterTab && (
                    <TabsContent value="voters" className="space-y-4">
                        {voterStats && (
                            <div className="flex flex-wrap items-center gap-3 py-1">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-600">
                                        Total Voters
                                    </span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {voterStats.total}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                                    <UserCheck className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">
                                        Voted
                                    </span>
                                    <span className="text-sm font-bold text-green-800">
                                        {voterStats.voted}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                                    <UserX className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-medium text-red-700">
                                        Not Voted
                                    </span>
                                    <span className="text-sm font-bold text-red-800">
                                        {voterStats.notVoted}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                                    <TrendingUp className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-700">
                                        Turnout
                                    </span>
                                    <span className="text-sm font-bold text-purple-800">
                                        {voterStats.turnout}%
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 rounded-t-2xl">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-purple-600" />
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Filter Voters
                                    </h3>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder="Search by name, ID, email..."
                                            className="pl-10 rounded-xl bg-gray-50 border-gray-200"
                                            value={voterSearch}
                                            onChange={(e) => {
                                                setVoterSearch(e.target.value);
                                                setVoterPage(1);
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <select
                                            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                                            value={voterStatusFilter}
                                            onChange={(e) => {
                                                setVoterStatusFilter(
                                                    e.target.value,
                                                );
                                                setVoterPage(1);
                                            }}
                                        >
                                            <option value="all">
                                                All Status
                                            </option>
                                            <option value="voted">
                                                Voted (
                                                {
                                                    voters.filter(
                                                        (v) => v.has_voted,
                                                    ).length
                                                }
                                                )
                                            </option>
                                            <option value="not_voted">
                                                Not Voted (
                                                {
                                                    voters.filter(
                                                        (v) => !v.has_voted,
                                                    ).length
                                                }
                                                )
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                                            value={voterCourseFilter}
                                            onChange={(e) => {
                                                setVoterCourseFilter(
                                                    e.target.value,
                                                );
                                                setVoterPage(1);
                                            }}
                                        >
                                            <option value="all">
                                                All Courses
                                            </option>
                                            {uniqueCourses.map((course) => (
                                                <option
                                                    key={course}
                                                    value={course}
                                                >
                                                    {course}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                                            value={voterYearFilter}
                                            onChange={(e) => {
                                                setVoterYearFilter(
                                                    e.target.value,
                                                );
                                                setVoterPage(1);
                                            }}
                                        >
                                            <option value="all">
                                                All Years
                                            </option>
                                            {uniqueYears.map((year) => (
                                                <option key={year} value={year}>
                                                    Year {year}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="w-5 h-5 text-purple-600" />
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Voter List (
                                            {filteredVoters.length} records)
                                        </h3>
                                    </div>
                                    <span className="text-sm font-normal text-gray-500">
                                        Showing {paginatedVoters.length} of{" "}
                                        {filteredVoters.length} voters (Page{" "}
                                        {voterPage} of {totalVoterPages || 1})
                                    </span>
                                </div>
                            </div>

                            {paginatedVoters.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="p-3 text-left font-semibold text-gray-700">
                                                        Student ID
                                                    </th>
                                                    <th className="p-3 text-left font-semibold text-gray-700">
                                                        Name
                                                    </th>
                                                    <th className="p-3 text-left font-semibold text-gray-700">
                                                        Course
                                                    </th>
                                                    <th className="p-3 text-left font-semibold text-gray-700">
                                                        Year
                                                    </th>
                                                    <th className="p-3 text-left font-semibold text-gray-700">
                                                        Status
                                                    </th>
                                                    <th className="p-3 text-left font-semibold text-gray-700">
                                                        Voted At
                                                    </th>
                                                    <th className="p-3 text-left font-semibold text-gray-700">
                                                        Receipt
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {paginatedVoters.map(
                                                    (voter, idx) => (
                                                        <tr
                                                            key={
                                                                voter.voter_registry_id ||
                                                                idx
                                                            }
                                                            className="hover:bg-purple-50/30 transition-colors"
                                                        >
                                                            <td className="p-3 font-mono text-xs">
                                                                {voter.student_id ||
                                                                    "-"}
                                                            </td>
                                                            <td className="p-3 font-medium">
                                                                {
                                                                    voter.first_name
                                                                }{" "}
                                                                {
                                                                    voter.last_name
                                                                }
                                                            </td>
                                                            <td className="p-3">
                                                                {getCourseDisplay(
                                                                    voter.course,
                                                                )}
                                                            </td>
                                                            <td className="p-3">
                                                                {voter.year_level
                                                                    ? `Year ${voter.year_level}`
                                                                    : "-"}
                                                            </td>
                                                            <td className="p-3">
                                                                {voter.has_voted ? (
                                                                    <Badge className="bg-green-100 text-green-700 border-0">
                                                                        <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                                                        Voted
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-yellow-100 text-yellow-700 border-0">
                                                                        <Clock className="w-3 h-3 mr-1" />{" "}
                                                                        Not Voted
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-sm text-gray-500">
                                                                {voter.voted_at
                                                                    ? new Date(
                                                                          voter.voted_at,
                                                                      ).toLocaleString()
                                                                    : "-"}
                                                            </td>
                                                            <td className="p-3">
                                                                {voter.receipt_code ? (
                                                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                                        {
                                                                            voter.receipt_code
                                                                        }
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">
                                                                        -
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {totalVoterPages > 1 && (
                                        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setVoterPage((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                disabled={voterPage === 1}
                                                className="rounded-xl"
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-1" />
                                                Previous
                                            </Button>
                                            <span className="text-sm text-gray-500">
                                                Page {voterPage} of{" "}
                                                {totalVoterPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setVoterPage((p) =>
                                                        Math.min(
                                                            totalVoterPages,
                                                            p + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    voterPage ===
                                                    totalVoterPages
                                                }
                                                className="rounded-xl"
                                            >
                                                Next
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium">
                                        No voters found
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {voterSearch
                                            ? "Try adjusting your search criteria"
                                            : "No voters registered for this election"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default LiveResults;