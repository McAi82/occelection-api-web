// resources/js/pages/Elections/ElectionDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { electionAPI } from "../api/elections";
import {
    Calendar,
    Clock,
    Users,
    Award,
    Building2,
    Mail,
    GraduationCap,
    ChevronRight,
    LayoutGrid,
    List,
    Loader2,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Info,
    FileText,
} from "lucide-react";

// ✅ List is default
type ViewMode = "list" | "grid";

interface Election {
    election_id: number;
    title: string;
    election_type: string;
    description?: string;
    voting_start: string;
    voting_end: string;
    course_id?: number;
    course?: {
        course_id: number;
        course_code: string;
        course_name: string;
    };
    positions?: Position[];
    partylists?: Partylist[];
    candidates?: Candidate[];
    total_voters?: number;
    votes_cast?: number;
    status?: string;
    is_ongoing?: boolean;
    created_by?: {
        user_id: number;
        first_name: string;
        last_name: string;
    };
}

interface Position {
    position_id: number;
    title: string;
    category?: string;
    order_in_ballot: number;
    max_winners: number;
    description?: string;
}

interface Partylist {
    partylist_id: number;
    name: string;
    description?: string;
    logo_url?: string;
    candidates_count?: number;
    platform?: string;
}

interface Candidate {
    candidate_id: number;
    user_id: number;
    position_id: number;
    partylist_id?: number;
    platform?: string;
    qualifications?: string;
    is_approved: boolean;
    user?: {
        user_id: number;
        first_name: string;
        last_name: string;
        email: string;
        student_id: string;
        course_id?: number;
        year_level: number;
        face_reference_photo?: string;
        course?: {
            course_code: string;
            course_name: string;
        };
    };
    position?: {
        position_id: number;
        title: string;
        category?: string;
    };
    partylist?: {
        partylist_id: number;
        name: string;
        description?: string;
        logo_url?: string;
    };
}

const getImageUrl = (path?: string): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/storage")) return path;
    return `${path}`;
};

const ElectionDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [election, setElection] = useState<Election | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // ✅ List view is default
    const [candidateViewMode, setCandidateViewMode] =
        useState<ViewMode>("list");
    const [partylistViewMode, setPartylistViewMode] =
        useState<ViewMode>("list");

    useEffect(() => {
        if (id) {
            fetchElectionDetails();
        }
    }, [id]);

    const fetchElectionDetails = async (): Promise<void> => {
        setLoading(true);
        setError("");
        try {
            console.log("Fetching election with ID:", id);
            const response = await electionAPI.getById(id!);
            console.log("API Response:", response);

            let electionData = null;
            if (response.data) {
                if (response.data.data) {
                    electionData = response.data.data;
                } else {
                    electionData = response.data;
                }
            }

            console.log("Election data:", electionData);

            if (electionData) {
                setElection(electionData);
            } else {
                setError("Election not found");
            }
        } catch (err: any) {
            console.error("Failed to fetch election:", err);
            const errorMessage =
                err.response?.data?.message ||
                "Failed to load election details";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (): {
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

        if (now < start)
            return {
                label: "Upcoming",
                color: "bg-yellow-100 text-yellow-800",
                icon: Clock,
            };
        if (now > end)
            return {
                label: "Ended",
                color: "bg-gray-100 text-gray-800",
                icon: CheckCircle,
            };
        return {
            label: "Ongoing",
            color: "bg-green-100 text-green-800",
            icon: TrendingUp,
        };
    };

    const getCandidatesByPosition = (): Record<string, Candidate[]> => {
        const candidates = election?.candidates || [];
        const grouped: Record<string, Candidate[]> = {};
        candidates.forEach((candidate) => {
            const position = candidate.position?.title || "Other";
            if (!grouped[position]) grouped[position] = [];
            grouped[position].push(candidate);
        });
        return grouped;
    };

    const status = getStatus();
    const StatusIcon = status.icon;
    const groupedCandidates = getCandidatesByPosition();
    const totalCandidates = election?.candidates?.length || 0;
    const partylists = election?.partylists || [];

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !election) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <div className="flex items-center justify-center mb-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Election Not Found
                </h2>
                <p className="text-gray-500 mb-4">
                    {error || "The election you're looking for does not exist."}
                </p>
                <Button onClick={() => navigate("/elections")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Elections
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/elections")}
                    className="-ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
            </div>

            {/* Election Header Card */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div
                    className={`h-2 ${
                        election.election_type === "CSG"
                            ? "bg-blue-600"
                            : election.election_type === "SBO"
                              ? "bg-green-600"
                              : "bg-purple-600"
                    }`}
                />
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    {election.title}
                                </h1>
                                <Badge className={status.color}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {status.label}
                                </Badge>
                            </div>
                            <p className="text-gray-600">
                                {election.description}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(
                                        election.voting_start,
                                    ).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {new Date(
                                        election.voting_start,
                                    ).toLocaleTimeString()}{" "}
                                    -{" "}
                                    {new Date(
                                        election.voting_end,
                                    ).toLocaleTimeString()}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Award className="w-4 h-4" />
                                    {election.election_type}
                                </div>
                                {election.course && (
                                    <div className="flex items-center gap-1">
                                        <GraduationCap className="w-4 h-4" />
                                        {election.course.course_code}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="px-4 py-2">
                                <Users className="w-4 h-4 mr-1" />
                                {totalCandidates} Candidates
                            </Badge>
                            {election.positions && (
                                <Badge variant="outline" className="px-4 py-2">
                                    <Award className="w-4 h-4 mr-1" />
                                    {election.positions.length} Positions
                                </Badge>
                            )}
                            {election.partylists && (
                                <Badge variant="outline" className="px-4 py-2">
                                    <Building2 className="w-4 h-4 mr-1" />
                                    {election.partylists.length} Partylists
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="candidates" className="space-y-4">
                <TabsList className="bg-gray-100 p-1 rounded-xl flex-wrap">
                    <TabsTrigger
                        value="candidates"
                        className="rounded-lg data-[state=active]:data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Candidates
                    </TabsTrigger>
                    <TabsTrigger
                        value="partylists"
                        className="rounded-lg data-[state=active]:data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <Building2 className="w-4 h-4 mr-2" />
                        Partylists
                    </TabsTrigger>
                    <TabsTrigger
                        value="information"
                        className="rounded-lg data-[state=active]:data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <Info className="w-4 h-4 mr-2" />
                        Information
                    </TabsTrigger>
                </TabsList>

                {/* ============ CANDIDATES TAB ============ */}
                <TabsContent value="candidates" className="space-y-4">
                    {/* View Toggle - List is default and active */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Candidates
                            </h2>
                            <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700"
                            >
                                {totalCandidates} total
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                            {/* ✅ List is default and active */}
                            <button
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                    candidateViewMode === "list"
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                }`}
                                onClick={() => setCandidateViewMode("list")}
                            >
                                <List className="w-4 h-4" />
                                List
                            </button>
                            <button
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                    candidateViewMode === "grid"
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                }`}
                                onClick={() => setCandidateViewMode("grid")}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Grid
                            </button>
                        </div>
                    </div>

                    {/* Candidates Display */}
                    {totalCandidates === 0 ? (
                        <Card className="rounded-xl">
                            <CardContent className="text-center py-16">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    No Candidates Yet
                                </h3>
                                <p className="text-gray-500">
                                    Candidates will appear here once they are
                                    approved.
                                </p>
                            </CardContent>
                        </Card>
                    ) : candidateViewMode === "list" ? (
                        // ✅ LIST VIEW (DEFAULT)
                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Candidate
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Position
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Course
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Partylist
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Student ID
                                                </th>
                                                <th className="text-right p-4 text-sm font-semibold text-gray-700">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {Object.entries(
                                                groupedCandidates,
                                            ).map(
                                                ([
                                                    position,
                                                    positionCandidates,
                                                ]) =>
                                                    positionCandidates.map(
                                                        (candidate, idx) => (
                                                            <tr
                                                                key={`${position}-${idx}`}
                                                                className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/candidates/${candidate.candidate_id}`,
                                                                    )
                                                                }
                                                            >
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="w-10 h-10 ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all">
                                                                            <AvatarImage
                                                                                src={
                                                                                    getImageUrl(
                                                                                        candidate
                                                                                            .user
                                                                                            ?.face_reference_photo,
                                                                                    ) ||
                                                                                    undefined
                                                                                }
                                                                            />
                                                                            <AvatarFallback className="bg-blue-500 text-white text-sm font-bold">
                                                                                {
                                                                                    candidate
                                                                                        .user
                                                                                        ?.first_name?.[0]
                                                                                }
                                                                                {
                                                                                    candidate
                                                                                        .user
                                                                                        ?.last_name?.[0]
                                                                                }
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                                {
                                                                                    candidate
                                                                                        .user
                                                                                        ?.first_name
                                                                                }{" "}
                                                                                {
                                                                                    candidate
                                                                                        .user
                                                                                        ?.last_name
                                                                                }
                                                                            </p>
                                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                                <Mail className="w-3 h-3" />
                                                                                <span>
                                                                                    {
                                                                                        candidate
                                                                                            .user
                                                                                            ?.email
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <Badge className="bg-blue-100 text-blue-700 border-0">
                                                                        {candidate
                                                                            .position
                                                                            ?.title ||
                                                                            "N/A"}
                                                                    </Badge>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                        <GraduationCap className="w-4 h-4 text-gray-400" />
                                                                        {candidate
                                                                            .user
                                                                            ?.course
                                                                            ?.course_code ||
                                                                            "N/A"}
                                                                        <span className="text-gray-400 text-xs">
                                                                            (Year{" "}
                                                                            {candidate
                                                                                .user
                                                                                ?.year_level ||
                                                                                "N/A"}
                                                                            )
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    {candidate.partylist ? (
                                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                            <Building2 className="w-4 h-4 text-purple-500" />
                                                                            {
                                                                                candidate
                                                                                    .partylist
                                                                                    .name
                                                                            }
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-sm text-gray-400">
                                                                            Independent
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-4">
                                                                    <span className="text-sm font-mono text-gray-500">
                                                                        {candidate
                                                                            .user
                                                                            ?.student_id ||
                                                                            "N/A"}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            navigate(
                                                                                `/candidates/${candidate.candidate_id}`,
                                                                            );
                                                                        }}
                                                                    >
                                                                        View
                                                                        Profile
                                                                        <ChevronRight className="w-4 h-4 ml-1" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        // GRID VIEW
                        <div className="space-y-6">
                            {Object.entries(groupedCandidates).map(
                                ([position, positionCandidates]) => (
                                    <Card
                                        key={position}
                                        className="border-0 shadow-lg rounded-xl overflow-hidden"
                                    >
                                        <CardHeader className="bg-gray-100 border-b">
                                            <CardTitle className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                    <Award className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-xl">
                                                    {position}
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-2 px-3 py-1"
                                                >
                                                    {positionCandidates.length}{" "}
                                                    {positionCandidates.length ===
                                                    1
                                                        ? "Candidate"
                                                        : "Candidates"}
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                {positionCandidates.map(
                                                    (candidate) => (
                                                        <div
                                                            key={
                                                                candidate.candidate_id
                                                            }
                                                            className="group bg-white border rounded-xl p-5 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/candidates/${candidate.candidate_id}`,
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-start gap-4">
                                                                <Avatar className="w-16 h-16 ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all">
                                                                    <AvatarImage
                                                                        src={
                                                                            getImageUrl(
                                                                                candidate
                                                                                    .user
                                                                                    ?.face_reference_photo,
                                                                            ) ||
                                                                            undefined
                                                                        }
                                                                    />
                                                                    <AvatarFallback className="bg-blue-500 text-white text-lg font-bold">
                                                                        {
                                                                            candidate
                                                                                .user
                                                                                ?.first_name?.[0]
                                                                        }
                                                                        {
                                                                            candidate
                                                                                .user
                                                                                ?.last_name?.[0]
                                                                        }
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1">
                                                                    <h3 className="font-bold text-gray-900 text-lg">
                                                                        {
                                                                            candidate
                                                                                .user
                                                                                ?.first_name
                                                                        }{" "}
                                                                        {
                                                                            candidate
                                                                                .user
                                                                                ?.last_name
                                                                        }
                                                                    </h3>
                                                                    {candidate.partylist && (
                                                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                                            <Building2 className="w-3 h-3" />
                                                                            {
                                                                                candidate
                                                                                    .partylist
                                                                                    .name
                                                                            }
                                                                        </p>
                                                                    )}
                                                                    <div className="mt-2">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs bg-gray-50"
                                                                        >
                                                                            {candidate
                                                                                .user
                                                                                ?.course
                                                                                ?.course_code ||
                                                                                "N/A"}{" "}
                                                                            -
                                                                            Year{" "}
                                                                            {candidate
                                                                                .user
                                                                                ?.year_level ||
                                                                                "N/A"}
                                                                        </Badge>
                                                                    </div>
                                                                    <Button
                                                                        variant="link"
                                                                        className="p-0 h-auto mt-3 text-blue-600 group-hover:text-blue-700"
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            navigate(
                                                                                `/candidates/${candidate.candidate_id}`,
                                                                            );
                                                                        }}
                                                                    >
                                                                        View
                                                                        Profile
                                                                        →
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ),
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* ============ PARTYLISTS TAB ============ */}
                <TabsContent value="partylists" className="space-y-4">
                    {/* View Toggle - List is default and active */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Partylists
                            </h2>
                            <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700"
                            >
                                {partylists.length} total
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                            {/* ✅ List is default and active */}
                            <button
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                    partylistViewMode === "list"
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                }`}
                                onClick={() => setPartylistViewMode("list")}
                            >
                                <List className="w-4 h-4" />
                                List
                            </button>
                            <button
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                    partylistViewMode === "grid"
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                }`}
                                onClick={() => setPartylistViewMode("grid")}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Grid
                            </button>
                        </div>
                    </div>

                    {/* Partylists Display */}
                    {partylists.length === 0 ? (
                        <Card className="rounded-xl">
                            <CardContent className="text-center py-16">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    No Partylists Yet
                                </h3>
                                <p className="text-gray-500">
                                    Partylists will appear here once they are
                                    created.
                                </p>
                            </CardContent>
                        </Card>
                    ) : partylistViewMode === "list" ? (
                        // ✅ LIST VIEW (DEFAULT)
                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 border-b">
                                            <tr>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Partylist
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Description
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Members
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Platform
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {partylists.map((partylist) => (
                                                <tr
                                                    key={partylist.partylist_id}
                                                    className="hover:bg-blue-50/50 transition-colors"
                                                >
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            {partylist.logo_url ? (
                                                                <img
                                                                    src={
                                                                        partylist.logo_url
                                                                    }
                                                                    alt={
                                                                        partylist.name
                                                                    }
                                                                    className="w-10 h-10 rounded-lg object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                    <Building2 className="w-5 h-5 text-white" />
                                                                </div>
                                                            )}
                                                            <span className="font-semibold text-gray-900">
                                                                {partylist.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm text-gray-600 line-clamp-1">
                                                            {partylist.description ||
                                                                "-"}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-sm"
                                                        >
                                                            <Users className="w-3 h-3 mr-1" />
                                                            {partylist.candidates_count ||
                                                                0}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm text-gray-600 line-clamp-1">
                                                            {partylist.platform ||
                                                                "-"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        // GRID VIEW
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {partylists.map((partylist) => (
                                <Card
                                    key={partylist.partylist_id}
                                    className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            {partylist.logo_url ? (
                                                <img
                                                    src={partylist.logo_url}
                                                    alt={partylist.name}
                                                    className="w-16 h-16 rounded-xl object-cover border-2 border-gray-100"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center">
                                                    <Building2 className="w-8 h-8 text-white" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">
                                                    {partylist.name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Users className="w-4 h-4" />
                                                    <span>
                                                        {partylist.candidates_count ||
                                                            0}{" "}
                                                        members
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {partylist.description ||
                                                "No description provided"}
                                        </p>
                                        {partylist.platform && (
                                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs font-medium text-gray-500">
                                                    Platform
                                                </p>
                                                <p className="text-sm text-gray-700 line-clamp-2">
                                                    {partylist.platform}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ============ INFORMATION TAB ============ */}
                <TabsContent value="information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                            <CardHeader className="bg-gray-100 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="w-5 h-5 text-blue-600" />
                                    Election Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center border-b pb-3">
                                    <span className="text-sm text-gray-500">
                                        Title
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {election.title}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-3">
                                    <span className="text-sm text-gray-500">
                                        Type
                                    </span>
                                    <Badge>{election.election_type}</Badge>
                                </div>
                                <div className="flex justify-between items-center border-b pb-3">
                                    <span className="text-sm text-gray-500">
                                        Status
                                    </span>
                                    <Badge className={status.color}>
                                        {status.label}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center border-b pb-3">
                                    <span className="text-sm text-gray-500">
                                        Voting Period
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {new Date(
                                            election.voting_start,
                                        ).toLocaleDateString()}{" "}
                                        -{" "}
                                        {new Date(
                                            election.voting_end,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                {election.course && (
                                    <div className="flex justify-between items-center border-b pb-3">
                                        <span className="text-sm text-gray-500">
                                            Course
                                        </span>
                                        <span className="font-semibold text-gray-900">
                                            {election.course.course_code} -{" "}
                                            {election.course.course_name}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center border-b pb-3">
                                    <span className="text-sm text-gray-500">
                                        Total Positions
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {election.positions?.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">
                                        Total Partylists
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {election.partylists?.length || 0}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                            <CardHeader className="bg-gray-100 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-blue-600" />
                                    Positions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {election.positions &&
                                election.positions.length > 0 ? (
                                    <div className="space-y-3">
                                        {election.positions
                                            .sort(
                                                (a, b) =>
                                                    a.order_in_ballot -
                                                    b.order_in_ballot,
                                            )
                                            .map((position) => (
                                                <div
                                                    key={position.position_id}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                >
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {position.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {position.category ||
                                                                "General"}{" "}
                                                            •{" "}
                                                            {
                                                                position.max_winners
                                                            }{" "}
                                                            winner
                                                            {position.max_winners >
                                                            1
                                                                ? "s"
                                                                : ""}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        #
                                                        {
                                                            position.order_in_ballot
                                                        }
                                                    </Badge>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        No positions defined
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Description */}
                    {election.description && (
                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                            <CardHeader className="bg-gray-100 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {election.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ElectionDetails;
