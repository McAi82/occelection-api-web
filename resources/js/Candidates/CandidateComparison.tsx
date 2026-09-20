// resources/js/pages/Candidates/CandidateComparison.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { Checkbox } from "../components/ui/checkbox";
import { candidateAPI } from "../api/candidates";
import { electionAPI } from "../api/elections";
import {
    Scale,
    Building2,
    Award,
    Target,
    GraduationCap,
    Users,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    ArrowLeft,
    TrendingUp,
    Star,
    Crown,
    Sparkles,
    FileText,
    Info,
    LayoutGrid,
    List,
    ChevronRight,
    User,
    Mail,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
}

interface Position {
    position_id: number;
    title: string;
}

interface Partylist {
    partylist_id: number;
    name: string;
}

interface User {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    student_id: string;
    course: string | { course_code: string; course_name: string };
    year_level: number;
    face_reference_photo?: string;
}

interface Candidate {
    candidate_id: number;
    user_id: number;
    position_id: number;
    partylist_id?: number;
    platform?: string;
    qualifications?: string;
    is_approved: boolean;
    user?: User;
    position?: Position;
    partylist?: Partylist;
}

interface ComparisonData {
    candidate_id: number;
    name: string;
    partylist: string;
    position?: string;
    course: string;
    yearLevel?: number;
    platform?: string;
    qualifications?: string;
    photoUrl: string | null;
    initials: string;
    email?: string;
    studentId?: string;
}

// ✅ List is default view mode
type ViewMode = "list" | "grid";

const getImageUrl = (path?: string): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/storage")) return path;
    return `${path}`;
};

const getCourseDisplay = (user?: User): string => {
    if (!user) return "N/A";
    if (
        user.course &&
        typeof user.course === "object" &&
        "course_code" in user.course
    ) {
        return (user.course as { course_code: string }).course_code;
    }
    if (typeof user.course === "string") return user.course;
    return "N/A";
};

const CandidateComparison: React.FC = () => {
    const navigate = useNavigate();
    const [elections, setElections] = useState<Election[]>([]);
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>(
        [],
    );
    const [groupedCandidates, setGroupedCandidates] = useState<
        Record<string, Candidate[]>
    >({});
    const [loading, setLoading] = useState(true);
    const [showComparison, setShowComparison] = useState(false);
    const [hoveredCandidate, setHoveredCandidate] = useState<number | null>(
        null,
    );
    // ✅ List view is default
    const [viewMode, setViewMode] = useState<ViewMode>("list");

    useEffect(() => {
        fetchElections();
    }, []);

    useEffect(() => {
        if (selectedElection) fetchCandidates();
    }, [selectedElection]);

    const fetchElections = async (): Promise<void> => {
        try {
            const response = await electionAPI.getAll();
            const electionsData = response.data;
            setElections(Array.isArray(electionsData) ? electionsData : []);
            if (electionsData && electionsData.length > 0) {
                setSelectedElection(electionsData[0].election_id.toString());
            }
        } catch (error) {
            console.error("Failed to fetch elections:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCandidates = async (): Promise<void> => {
        setLoading(true);
        try {
            const response = await candidateAPI.getByElection(selectedElection);
            const candidatesData = response.data;
            const allCandidates = Array.isArray(candidatesData)
                ? candidatesData
                : [];
            const approvedCandidates = allCandidates.filter(
                (c: Candidate) => c.is_approved,
            );
            setCandidates(approvedCandidates);
            const grouped: Record<string, Candidate[]> = {};
            approvedCandidates.forEach((candidate: Candidate) => {
                const position = candidate.position?.title || "Other";
                if (!grouped[position]) grouped[position] = [];
                grouped[position].push(candidate);
            });
            setGroupedCandidates(grouped);
        } catch (error) {
            console.error("Failed to fetch candidates:", error);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedPosition = (): string | null => {
        if (selectedCandidates.length === 0) return null;
        return selectedCandidates[0].position?.title || "Other";
    };

    const canSelectCandidate = (candidate: Candidate): boolean => {
        if (selectedCandidates.length === 0) return true;
        const selectedPosition = getSelectedPosition();
        const candidatePosition = candidate.position?.title || "Other";
        return selectedPosition === candidatePosition;
    };

    const getDisabledReason = (candidate: Candidate): string | null => {
        if (selectedCandidates.length === 0) return null;
        const selectedPosition = getSelectedPosition();
        const candidatePosition = candidate.position?.title || "Other";
        if (selectedPosition !== candidatePosition) {
            return `Only ${selectedPosition} candidates can be compared`;
        }
        return null;
    };

    const toggleCandidate = (candidate: Candidate): void => {
        const isSelected = selectedCandidates.find(
            (c) => c.candidate_id === candidate.candidate_id,
        );

        if (isSelected) {
            setSelectedCandidates(
                selectedCandidates.filter(
                    (c) => c.candidate_id !== candidate.candidate_id,
                ),
            );
        } else {
            if (!canSelectCandidate(candidate)) {
                const selectedPosition = getSelectedPosition();
                alert(
                    `You can only compare candidates from the same position. Currently comparing ${selectedPosition} candidates. Please clear selection to compare ${candidate.position?.title || "Other"} candidates.`,
                );
                return;
            }
            if (selectedCandidates.length < 3) {
                setSelectedCandidates([...selectedCandidates, candidate]);
            } else {
                alert("You can only compare up to 3 candidates at a time");
            }
        }
    };

    const clearSelection = (): void => {
        setSelectedCandidates([]);
        setShowComparison(false);
    };

    const startComparison = (): void => {
        if (selectedCandidates.length < 2) {
            alert("Please select at least 2 candidates to compare");
            return;
        }
        setShowComparison(true);
    };

    const getComparisonData = (candidate: Candidate): ComparisonData => {
        const user = candidate.user;
        const photoUrl = getImageUrl(user?.face_reference_photo);
        return {
            candidate_id: candidate.candidate_id,
            name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
            partylist: candidate.partylist?.name || "Independent",
            position: candidate.position?.title,
            course: getCourseDisplay(user),
            yearLevel: user?.year_level,
            platform: candidate.platform,
            qualifications: candidate.qualifications,
            photoUrl: photoUrl ? `${photoUrl}` : null,
            initials:
                `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase(),
            email: user?.email,
            studentId: user?.student_id,
        };
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        <Loader2 className="relative w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    </div>
                    <p className="text-gray-600 font-medium">
                        Loading candidates...
                    </p>
                </div>
            </div>
        );
    }

    if (showComparison) {
        const comparisonData = selectedCandidates.map(getComparisonData);
        const selectedPosition = getSelectedPosition();

        return (
            <div className="space-y-6">
                <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative px-6 py-6">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Scale className="w-5 h-5 text-yellow-300" />
                                    <Badge className="bg-white/20 text-white border-0">
                                        Comparison Mode
                                    </Badge>
                                </div>
                                <h1 className="text-2xl font-bold text-white">
                                    Candidate Comparison
                                </h1>
                                <p className="text-blue-100 text-sm">
                                    Comparing {selectedCandidates.length}{" "}
                                    candidates side by side
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowComparison(false)}
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={clearSelection}
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                                >
                                    Clear All
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                    <Info className="w-5 h-5 text-blue-600" />
                    <div>
                        <span className="font-semibold text-blue-900">
                            Comparing Position:{" "}
                        </span>
                        <span className="text-blue-700">
                            {selectedPosition}
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border bg-white shadow-lg">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 text-left w-36 font-semibold text-gray-700">
                                    Criteria
                                </th>
                                {comparisonData.map((candidate, idx) => (
                                    <th
                                        key={`header-${idx}`}
                                        className="p-5 text-center min-w-[280px]"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="relative">
                                                <Avatar className="w-28 h-28 mb-3 ring-4 ring-blue-100 shadow-lg">
                                                    <AvatarImage
                                                        src={
                                                            candidate.photoUrl ||
                                                            undefined
                                                        }
                                                    />
                                                    <AvatarFallback className="bg-blue-500 text-white text-2xl font-bold">
                                                        {candidate.initials ||
                                                            "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {idx === 0 && (
                                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                                                        <Crown className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="font-bold text-lg text-gray-900">
                                                {candidate.name}
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className="mt-1 bg-blue-50 text-blue-700"
                                            >
                                                {candidate.partylist}
                                            </Badge>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-semibold bg-gray-50 text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-blue-600" />
                                        Position
                                    </div>
                                </td>
                                {comparisonData.map((candidate, idx) => (
                                    <td
                                        key={`position-${idx}`}
                                        className="p-4 text-center"
                                    >
                                        <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1">
                                            {candidate.position}
                                        </Badge>
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-b hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-semibold bg-gray-50 text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-green-600" />
                                        Course & Year
                                    </div>
                                </td>
                                {comparisonData.map((candidate, idx) => (
                                    <td
                                        key={`course-${idx}`}
                                        className="p-4 text-center"
                                    >
                                        <span className="text-gray-700">
                                            {candidate.course}
                                        </span>
                                        <span className="text-gray-400 mx-1">
                                            -
                                        </span>
                                        <span className="text-gray-700">
                                            Year {candidate.yearLevel}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-b hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-semibold bg-gray-50 text-gray-700 align-top">
                                    <div className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-purple-600" />
                                        Platform
                                    </div>
                                </td>
                                {comparisonData.map((candidate, idx) => (
                                    <td
                                        key={`platform-${idx}`}
                                        className="p-4 align-top"
                                    >
                                        <div className="max-h-80 overflow-y-auto whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-xl border">
                                            {candidate.platform ||
                                                "No platform provided"}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-semibold bg-gray-50 text-gray-700 align-top">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-yellow-600" />
                                        Qualifications
                                    </div>
                                </td>
                                {comparisonData.map((candidate, idx) => (
                                    <td
                                        key={`qualifications-${idx}`}
                                        className="p-4 align-top"
                                    >
                                        <div className="max-h-80 overflow-y-auto whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-xl border">
                                            {candidate.qualifications ||
                                                "No qualifications listed"}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const selectedPosition = getSelectedPosition();

    return (
        <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Scale className="w-5 h-5 text-yellow-300" />
                        <Badge className="bg-white/20 text-white border-0">
                            Compare Candidates
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Compare Candidates
                    </h1>
                    <p className="text-blue-100 mt-1">
                        Select up to 3 candidates to compare their platforms and
                        qualifications
                    </p>
                    {selectedCandidates.length > 0 && selectedPosition && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
                            <Info className="w-4 h-4 text-yellow-300" />
                            <span className="text-white text-sm">
                                Currently comparing: {selectedPosition}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900">
                            Select Election
                        </h3>
                    </div>
                </div>
                <CardContent className="p-5">
                    <select
                        className="w-full md:w-80 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
                        value={selectedElection}
                        onChange={(e) => {
                            setSelectedElection(e.target.value);
                            clearSelection();
                        }}
                    >
                        {elections.map((election) => (
                            <option
                                key={election.election_id}
                                value={election.election_id}
                            >
                                {election.title}
                            </option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {selectedCandidates.length > 0 && (
                <Card className="bg-blue-50 border-0 rounded-xl shadow-md animate-in fade-in slide-in-from-top duration-300">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                                        <Scale className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-semibold text-gray-800">
                                        Selected {selectedCandidates.length}/3{" "}
                                        {selectedPosition} candidate(s):
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCandidates.map((c) => (
                                        <Badge
                                            key={c.candidate_id}
                                            className="bg-white text-gray-800 border-blue-200 px-3 py-1.5 shadow-sm"
                                        >
                                            {c.user?.first_name}{" "}
                                            {c.user?.last_name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearSelection}
                                    className="rounded-lg border-gray-300 hover:border-red-300 hover:bg-red-50"
                                >
                                    Clear All
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={startComparison}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md"
                                >
                                    Compare Now{" "}
                                    <TrendingUp className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {Object.keys(groupedCandidates).length > 0 ? (
                <>
                    {/* View Toggle */}
                    <div className="flex items-center justify-end gap-2 bg-gray-100 rounded-xl p-1 w-fit ml-auto">
                        {/* ✅ List is default and active */}
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

                    <Tabs
                        defaultValue={Object.keys(groupedCandidates)[0]}
                        className="space-y-5"
                    >
                        <TabsList className="flex flex-wrap h-auto gap-2 bg-gray-100 p-1 rounded-xl">
                            {Object.keys(groupedCandidates).map((position) => {
                                const isDisabled =
                                    selectedCandidates.length > 0 &&
                                    selectedPosition !== position;
                                return (
                                    <TabsTrigger
                                        key={position}
                                        value={position}
                                        disabled={isDisabled}
                                        className={`rounded-lg px-5 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white ${
                                            isDisabled
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }`}
                                    >
                                        <Award className="w-4 h-4 mr-2" />
                                        {position}
                                        {isDisabled &&
                                            selectedCandidates.length > 0 && (
                                                <span className="ml-2 text-xs text-red-500">
                                                    (Locked)
                                                </span>
                                            )}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        {Object.entries(groupedCandidates).map(
                            ([position, positionCandidates]) => {
                                const isPositionDisabled =
                                    selectedCandidates.length > 0 &&
                                    selectedPosition !== position;

                                return (
                                    <TabsContent
                                        key={position}
                                        value={position}
                                    >
                                        {isPositionDisabled &&
                                            selectedCandidates.length > 0 && (
                                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                                                    <Info className="w-4 h-4 text-yellow-600" />
                                                    <span className="text-sm text-yellow-800">
                                                        You cannot select
                                                        candidates from this
                                                        position because you're
                                                        currently comparing{" "}
                                                        {selectedPosition}{" "}
                                                        candidates.
                                                        <button
                                                            onClick={
                                                                clearSelection
                                                            }
                                                            className="ml-2 text-blue-600 underline hover:text-blue-800"
                                                        >
                                                            Clear selection to
                                                            compare {position}
                                                        </button>
                                                    </span>
                                                </div>
                                            )}

                                        {viewMode === "list" ? (
                                            // ✅ LIST VIEW (DEFAULT)
                                            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                                                <CardContent className="p-0">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full">
                                                            <thead className="bg-gray-50 border-b">
                                                                <tr>
                                                                    <th className="text-left p-4 text-sm font-semibold text-gray-700 w-12">
                                                                        Select
                                                                    </th>
                                                                    <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                                        Candidate
                                                                    </th>
                                                                    <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                                        Partylist
                                                                    </th>
                                                                    <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                                        Course
                                                                    </th>
                                                                    <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                                        Year
                                                                    </th>
                                                                    <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                                        Platform
                                                                    </th>
                                                                    <th className="text-right p-4 text-sm font-semibold text-gray-700">
                                                                        Action
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {positionCandidates.map(
                                                                    (
                                                                        candidate,
                                                                    ) => {
                                                                        const isSelected =
                                                                            selectedCandidates.find(
                                                                                (
                                                                                    c,
                                                                                ) =>
                                                                                    c.candidate_id ===
                                                                                    candidate.candidate_id,
                                                                            );
                                                                        const isDisabled =
                                                                            isPositionDisabled &&
                                                                            !isSelected;
                                                                        const disabledReason =
                                                                            getDisabledReason(
                                                                                candidate,
                                                                            );
                                                                        const photoUrl =
                                                                            getImageUrl(
                                                                                candidate
                                                                                    .user
                                                                                    ?.face_reference_photo,
                                                                            );
                                                                        const initials =
                                                                            `${candidate.user?.first_name?.[0] || ""}${candidate.user?.last_name?.[0] || ""}`.toUpperCase();

                                                                        return (
                                                                            <tr
                                                                                key={
                                                                                    candidate.candidate_id
                                                                                }
                                                                                className={`hover:bg-blue-50/50 transition-colors group ${isDisabled ? "opacity-60" : "cursor-pointer"}`}
                                                                                onClick={() =>
                                                                                    !isDisabled &&
                                                                                    toggleCandidate(
                                                                                        candidate,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <td className="p-4">
                                                                                    <Checkbox
                                                                                        checked={
                                                                                            !!isSelected
                                                                                        }
                                                                                        onCheckedChange={() =>
                                                                                            !isDisabled &&
                                                                                            toggleCandidate(
                                                                                                candidate,
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            isDisabled
                                                                                        }
                                                                                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                                                    />
                                                                                </td>
                                                                                <td className="p-4">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <Avatar className="w-10 h-10 ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all">
                                                                                            <AvatarImage
                                                                                                src={
                                                                                                    photoUrl ||
                                                                                                    undefined
                                                                                                }
                                                                                            />
                                                                                            <AvatarFallback className="bg-blue-500 text-white text-sm font-bold">
                                                                                                {initials ||
                                                                                                    "?"}
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
                                                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                                        <GraduationCap className="w-4 h-4 text-gray-400" />
                                                                                        {getCourseDisplay(
                                                                                            candidate.user,
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="p-4">
                                                                                    <span className="text-sm text-gray-600">
                                                                                        Year{" "}
                                                                                        {candidate
                                                                                            .user
                                                                                            ?.year_level ||
                                                                                            "N/A"}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="p-4">
                                                                                    <span className="text-sm text-gray-600 line-clamp-1 max-w-[200px]">
                                                                                        {candidate.platform ||
                                                                                            "-"}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="p-4 text-right">
                                                                                    {isSelected ? (
                                                                                        <Badge className="bg-green-100 text-green-700 border-0">
                                                                                            <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                                                                            Selected
                                                                                        </Badge>
                                                                                    ) : isDisabled ? (
                                                                                        <Badge className="bg-gray-100 text-gray-500 border-0">
                                                                                            <XCircle className="w-3 h-3 mr-1" />{" "}
                                                                                            Locked
                                                                                        </Badge>
                                                                                    ) : (
                                                                                        <button
                                                                                            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                            onClick={(
                                                                                                e,
                                                                                            ) => {
                                                                                                e.stopPropagation();
                                                                                                toggleCandidate(
                                                                                                    candidate,
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            Select
                                                                                            <ChevronRight className="w-4 h-4" />
                                                                                        </button>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    },
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            // GRID VIEW
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                {positionCandidates.map(
                                                    (candidate) => {
                                                        const isSelected =
                                                            selectedCandidates.find(
                                                                (c) =>
                                                                    c.candidate_id ===
                                                                    candidate.candidate_id,
                                                            );
                                                        const isDisabled =
                                                            isPositionDisabled &&
                                                            !isSelected;
                                                        const disabledReason =
                                                            getDisabledReason(
                                                                candidate,
                                                            );
                                                        const photoUrl =
                                                            getImageUrl(
                                                                candidate.user
                                                                    ?.face_reference_photo,
                                                            );
                                                        const initials =
                                                            `${candidate.user?.first_name?.[0] || ""}${candidate.user?.last_name?.[0] || ""}`.toUpperCase();
                                                        const isHovered =
                                                            hoveredCandidate ===
                                                            candidate.candidate_id;

                                                        return (
                                                            <div
                                                                key={
                                                                    candidate.candidate_id
                                                                }
                                                                className={`group cursor-pointer rounded-xl transition-all duration-300 ${
                                                                    isDisabled
                                                                        ? "opacity-60 cursor-not-allowed"
                                                                        : ""
                                                                } ${
                                                                    isSelected
                                                                        ? "ring-2 ring-blue-500 shadow-xl scale-[1.02] bg-blue-50/30"
                                                                        : "border hover:border-blue-300 hover:shadow-lg hover:scale-[1.01]"
                                                                }`}
                                                                onClick={() =>
                                                                    !isDisabled &&
                                                                    toggleCandidate(
                                                                        candidate,
                                                                    )
                                                                }
                                                                onMouseEnter={() =>
                                                                    !isDisabled &&
                                                                    setHoveredCandidate(
                                                                        candidate.candidate_id,
                                                                    )
                                                                }
                                                                onMouseLeave={() =>
                                                                    setHoveredCandidate(
                                                                        null,
                                                                    )
                                                                }
                                                            >
                                                                <div className="bg-white rounded-xl p-5">
                                                                    <div className="flex items-start gap-4">
                                                                        <Checkbox
                                                                            checked={
                                                                                !!isSelected
                                                                            }
                                                                            onCheckedChange={() =>
                                                                                !isDisabled &&
                                                                                toggleCandidate(
                                                                                    candidate,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                isDisabled
                                                                            }
                                                                            className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                                        />
                                                                        <div className="relative">
                                                                            <Avatar
                                                                                className={`w-16 h-16 ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all shadow-md ${isDisabled ? "opacity-60" : ""}`}
                                                                            >
                                                                                <AvatarImage
                                                                                    src={
                                                                                        photoUrl ||
                                                                                        undefined
                                                                                    }
                                                                                />
                                                                                <AvatarFallback className="bg-blue-500 to-indigo-500 text-white text-lg font-bold">
                                                                                    {initials ||
                                                                                        "?"}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            {isSelected && (
                                                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
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
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            candidate
                                                                                                .partylist
                                                                                                .name
                                                                                        }
                                                                                    </span>
                                                                                </p>
                                                                            )}
                                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-xs bg-gray-50"
                                                                                >
                                                                                    {getCourseDisplay(
                                                                                        candidate.user,
                                                                                    )}
                                                                                </Badge>
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-xs bg-gray-50"
                                                                                >
                                                                                    Year{" "}
                                                                                    {
                                                                                        candidate
                                                                                            .user
                                                                                            ?.year_level
                                                                                    }
                                                                                </Badge>
                                                                            </div>
                                                                            {isDisabled &&
                                                                                disabledReason && (
                                                                                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                                                                        <AlertCircle className="w-3 h-3" />
                                                                                        {
                                                                                            disabledReason
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        className={`mt-4 pt-3 border-t transition-all duration-300 ${isHovered || isSelected ? "border-blue-200" : "border-gray-100"} ${isDisabled ? "opacity-60" : ""}`}
                                                                    >
                                                                        <p className="text-sm text-gray-600 line-clamp-2">
                                                                            {candidate.platform ||
                                                                                "No platform provided"}
                                                                        </p>
                                                                        {(candidate
                                                                            .platform
                                                                            ?.length ||
                                                                            0) >
                                                                            100 ||
                                                                        isHovered ? (
                                                                            <div className="mt-2 text-xs text-blue-500 flex items-center gap-1">
                                                                                <FileText className="w-3 h-3" />
                                                                                <span>
                                                                                    Click
                                                                                    to
                                                                                    view
                                                                                    full
                                                                                    details
                                                                                </span>
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                    {isSelected && (
                                                                        <div className="mt-3 pt-2 text-center">
                                                                            <Badge className="bg-green-100 text-green-700 border-0">
                                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                                Selected
                                                                                for
                                                                                comparison
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                    {isDisabled &&
                                                                        !isSelected &&
                                                                        disabledReason && (
                                                                            <div className="mt-3 pt-2 text-center">
                                                                                <Badge className="bg-gray-100 text-gray-500 border-0">
                                                                                    <XCircle className="w-3 h-3 mr-1" />
                                                                                    Cannot
                                                                                    select
                                                                                </Badge>
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>
                                );
                            },
                        )}
                    </Tabs>
                </>
            ) : (
                <Card className="rounded-xl border-0 shadow-lg">
                    <CardContent className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Candidates Available
                        </h3>
                        <p className="text-gray-500">
                            There are no approved candidates for this election
                            yet.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CandidateComparison;
