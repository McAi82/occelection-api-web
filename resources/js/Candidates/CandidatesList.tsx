// resources/js/pages/Candidates/CandidatesList.tsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useElections } from "../hooks/useElections";
import { useCandidates } from "../hooks/useCandidates";
import { RefreshButton } from "../components/common/RefreshButton";
import {
    Search,
    Building2,
    Award,
    Users,
    Loader2,
    LayoutGrid,
    List,
    ChevronRight,
    Mail,
    GraduationCap,
    Sparkles,
    MessageCircle,
} from "lucide-react";

type ViewMode = "list" | "grid";

const getImageUrl = (path?: string): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/storage")) return path;
    return `${path}`;
};

const getCourseDisplay = (user?: any): string => {
    if (!user) return "No Course";
    if (
        user.course &&
        typeof user.course === "object" &&
        "course_code" in user.course
    ) {
        return user.course.course_code;
    }
    if (typeof user.course === "string") return user.course;
    return "No Course";
};

const CandidatesList: React.FC = () => {
    const navigate = useNavigate();
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [viewMode, setViewMode] = useState<ViewMode>("list");

    const { data: elections = [], isLoading: electionsLoading } =
        useElections();

    React.useEffect(() => {
        if (elections.length > 0 && !selectedElection) {
            setSelectedElection(elections[0].election_id.toString());
        }
    }, [elections]);

    const {
        data: candidates = [],
        isLoading: candidatesLoading,
        refetch,
        isFetching,
    } = useCandidates(selectedElection);

    const filteredCandidates = useMemo(() => {
        let filtered = candidates;
        if (activeFilter !== "all") {
            filtered = filtered.filter(
                (c: any) =>
                    c.position?.category?.toLowerCase() ===
                    activeFilter.toLowerCase(),
            );
        }
        if (searchTerm) {
            filtered = filtered.filter(
                (c: any) =>
                    `${c.user?.first_name} ${c.user?.last_name}`
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    c.position?.title
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    c.partylist?.name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            );
        }
        return filtered;
    }, [candidates, searchTerm, activeFilter]);

    const groupByPosition = (): Record<string, any[]> => {
        const grouped: Record<string, any[]> = {};
        filteredCandidates.forEach((candidate: any) => {
            const position = candidate.position?.title || "Other";
            if (!grouped[position]) grouped[position] = [];
            grouped[position].push(candidate);
        });
        return grouped;
    };

    const groupedCandidates = groupByPosition();
    const totalCandidates = filteredCandidates.length;
    const isLoading = electionsLoading || candidatesLoading;

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Candidates
                    </h1>
                    <p className="text-gray-600">
                        Meet your student government candidates
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant="secondary"
                        className="px-4 py-2 bg-blue-100 text-blue-700"
                    >
                        <Users className="w-4 h-4 mr-1" /> {totalCandidates}{" "}
                        Total Candidates
                    </Badge>
                    <RefreshButton
                        onClick={() => refetch()}
                        isLoading={isFetching}
                    />
                </div>
            </div>

            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-blue-600 px-6 py-4">
                    <div className="flex items-center gap-2 text-white">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-semibold">Select Election</span>
                    </div>
                </div>
                <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <select
                            className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 min-w-[250px]"
                            value={selectedElection}
                            onChange={(e) =>
                                setSelectedElection(e.target.value)
                            }
                        >
                            {elections.map((election: any) => (
                                <option
                                    key={election.election_id}
                                    value={election.election_id}
                                >
                                    {election.title}
                                </option>
                            ))}
                        </select>
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search by name, position, or partylist..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 rounded-xl border-2 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {[
                        "all",
                        "executive",
                        "secretariat",
                        "senate",
                        "finance",
                    ].map((filter) => (
                        <Button
                            key={filter}
                            variant={
                                activeFilter === filter ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setActiveFilter(filter)}
                            className={`rounded-full px-5 transition-all duration-200 ${
                                activeFilter === filter
                                    ? "bg-blue-600 shadow-md"
                                    : ""
                            }`}
                        >
                            {filter === "all"
                                ? "All Candidates"
                                : filter.charAt(0).toUpperCase() +
                                  filter.slice(1)}
                        </Button>
                    ))}
                </div>
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
            </div>

            {Object.entries(groupedCandidates).length === 0 ? (
                <Card className="rounded-xl">
                    <CardContent className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            No Candidates Found
                        </h3>
                        <p className="text-gray-500">
                            No approved candidates are available for this
                            election yet.
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === "list" ? (
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
                                    {Object.entries(groupedCandidates).map(
                                        ([position, positionCandidates]) =>
                                            positionCandidates.map(
                                                (
                                                    candidate: any,
                                                    idx: number,
                                                ) => (
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
                                                                    <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
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
                                                                {getCourseDisplay(
                                                                    candidate.user,
                                                                )}
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
                                                                {candidate.user
                                                                    ?.student_id ||
                                                                    "N/A"}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        navigate(
                                                                            `/candidates/${candidate.candidate_id}`,
                                                                        );
                                                                    }}
                                                                >
                                                                    View Profile{" "}
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        navigate(
                                                                            `/candidate-timeline/${candidate.candidate_id}`,
                                                                        );
                                                                    }}
                                                                >
                                                                    <MessageCircle className="w-4 h-4" />
                                                                    Timeline
                                                                </button>
                                                            </div>
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
                <div className="space-y-6">
                    {Object.entries(groupedCandidates).map(
                        ([position, positionCandidates]) => (
                            <Card
                                key={position}
                                className="border-0 shadow-lg rounded-xl overflow-hidden"
                            >
                                <CardHeader className="bg-gray-50 border-b">
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
                                            {positionCandidates.length === 1
                                                ? "Candidate"
                                                : "Candidates"}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {positionCandidates.map(
                                            (candidate: any) => (
                                                <div
                                                    key={candidate.candidate_id}
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
                                                            <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">
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
                                                                    {getCourseDisplay(
                                                                        candidate.user,
                                                                    )}{" "}
                                                                    - Year{" "}
                                                                    {candidate
                                                                        .user
                                                                        ?.year_level ||
                                                                        "N/A"}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex gap-2 mt-3">
                                                                <Button
                                                                    variant="link"
                                                                    className="p-0 h-auto text-blue-600 group-hover:text-blue-700"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        navigate(
                                                                            `/candidates/${candidate.candidate_id}`,
                                                                        );
                                                                    }}
                                                                >
                                                                    View Profile
                                                                    →
                                                                </Button>
                                                                <Button
                                                                    variant="link"
                                                                    className="p-0 h-auto text-purple-600 group-hover:text-purple-700"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        navigate(
                                                                            `/candidate-timeline/${candidate.candidate_id}`,
                                                                        );
                                                                    }}
                                                                >
                                                                    <MessageCircle className="w-4 h-4 mr-1" />
                                                                    Timeline
                                                                </Button>
                                                            </div>
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
        </div>
    );
};

export default CandidatesList;