// resources/js/pages/Elections/ElectionsList.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useElections } from "../hooks/useElections";
import { RefreshButton } from "../components/common/RefreshButton";
import type { Election } from "../types";
import {
    Calendar,
    Vote,
    Building2,
    Users,
    Clock,
    CheckCircle,
    Activity,
    Loader2,
    Eye,
    LayoutGrid,
    List,
    Trophy,
    ChevronRight,
    CalendarDays,
    Sparkles,
} from "lucide-react";

type ViewMode = "list" | "grid"; // List is default

const ELECTION_TYPES: Record<
    string,
    { name: string; icon: React.ElementType; color: string; bgColor: string }
> = {
    CSG: {
        name: "Central Student Government",
        icon: Building2,
        color: "from-blue-600 to-indigo-600",
        bgColor: "bg-blue-100",
    },
    SBO: {
        name: "Student Body Organization",
        icon: Users,
        color: "from-green-600 to-teal-600",
        bgColor: "bg-green-100",
    },
};

const getElectionStatus = (
    election: Election,
): { label: string; color: string; icon: React.ElementType } => {
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
        icon: Activity,
    };
};

const getCourseDisplay = (course?: Election["course"]): string => {
    if (!course) return "";
    if (typeof course === "object") {
        if ("code" in course && typeof course.code === "string")
            return course.code;
        if ("course_code" in course && typeof course.course_code === "string")
            return course.course_code;
        if ("name" in course && typeof course.name === "string")
            return course.name;
        if ("course_name" in course && typeof course.course_name === "string")
            return course.course_name;
    }
    if (typeof course === "string") return course;
    return "";
};

const ElectionsList: React.FC = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState("all");
    // ✅ List view is default
    const [viewMode, setViewMode] = useState<ViewMode>("list");

    const {
        data: elections = [],
        isLoading,
        refetch,
        isFetching,
    } = useElections();

    const filteredElections = React.useMemo(() => {
        if (activeFilter === "all") return elections;
        return elections.filter(
            (e: Election) => e.election_type === activeFilter,
        );
    }, [elections, activeFilter]);

    const handleViewElection = (electionId: number): void => {
        navigate(`/elections/${electionId}`);
    };

    const handleViewResults = (electionId: number): void => {
        navigate(`/elections/${electionId}/live-results`);
    };

    const handleViewWinners = (electionId: number): void => {
        navigate(`/elections/${electionId}/winners`);
    };

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
                        Elections
                    </h1>
                    <p className="text-gray-600">
                        View all active, upcoming, and past elections
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant="secondary"
                        className="px-4 py-2 bg-blue-100 text-blue-700"
                    >
                        <Vote className="w-4 h-4 mr-1" />{" "}
                        {filteredElections.length} Total
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
                        <span className="font-semibold">Filter Elections</span>
                    </div>
                </div>
                <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <Tabs
                            defaultValue="all"
                            value={activeFilter}
                            onValueChange={setActiveFilter}
                            className="w-full md:w-auto"
                        >
                            <TabsList className="bg-gray-100 p-1 rounded-xl flex-wrap h-auto">
                                <TabsTrigger
                                    value="all"
                                    className="rounded-lg data-[state=active]:data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                                >
                                    All
                                </TabsTrigger>
                                <TabsTrigger
                                    value="CSG"
                                    className="rounded-lg data-[state=active]:data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                                >
                                    CSG
                                </TabsTrigger>
                                <TabsTrigger
                                    value="SBO"
                                    className="rounded-lg data-[state=active]:data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                                >
                                    SBO
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 flex-shrink-0">
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
                    </div>
                </CardContent>
            </Card>

            {filteredElections.length === 0 ? (
                <Card className="rounded-xl">
                    <CardContent className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No Elections Found
                        </h3>
                        <p className="text-gray-500">
                            {activeFilter !== "all"
                                ? `No ${activeFilter} elections available. Try a different filter.`
                                : "No elections are available at the moment."}
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === "list" ? (
                // ✅ LIST VIEW (DEFAULT)
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Election
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Type
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Status
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Date Range
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Course
                                        </th>
                                        <th className="text-right p-4 text-sm font-semibold text-gray-700">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredElections.map(
                                        (election: Election) => {
                                            const status =
                                                getElectionStatus(election);
                                            const StatusIcon = status.icon;
                                            const typeInfo =
                                                ELECTION_TYPES[
                                                    election.election_type
                                                ];
                                            const TypeIcon =
                                                typeInfo?.icon || Building2;
                                            const courseDisplay =
                                                getCourseDisplay(
                                                    election.course,
                                                );

                                            return (
                                                <tr
                                                    key={election.election_id}
                                                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                                    onClick={() =>
                                                        handleViewElection(
                                                            election.election_id,
                                                        )
                                                    }
                                                >
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-8 h-8 rounded-lg ${typeInfo?.bgColor || "bg-gray-100"} flex items-center justify-center flex-shrink-0`}
                                                            >
                                                                <TypeIcon className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                    {
                                                                        election.title
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-gray-500 line-clamp-1">
                                                                    {election.description ||
                                                                        "No description"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {
                                                                election.election_type
                                                            }
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge
                                                            className={
                                                                status.color
                                                            }
                                                        >
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {status.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                            <CalendarDays className="w-4 h-4 text-gray-400" />
                                                            {new Date(
                                                                election.voting_start,
                                                            ).toLocaleDateString()}
                                                            <span className="text-gray-400 mx-1">
                                                                →
                                                            </span>
                                                            {new Date(
                                                                election.voting_end,
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {courseDisplay ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {courseDisplay}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">
                                                                N/A
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                                            <button
                                                                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleViewElection(
                                                                        election.election_id,
                                                                    );
                                                                }}
                                                            >
                                                                View{" "}
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                            {status.label ===
                                                                "Ongoing" && (
                                                                <button
                                                                    className="text-sm font-bold bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleViewResults(
                                                                            election.election_id,
                                                                        );
                                                                    }}
                                                                >
                                                                    Live Results
                                                                </button>
                                                            )}
                                                            {status.label ===
                                                                "Ended" && (
                                                                <>
                                                                    <button
                                                                        className="text-sm font-bold text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            handleViewResults(
                                                                                election.election_id,
                                                                            );
                                                                        }}
                                                                    >
                                                                        Results
                                                                    </button>
                                                                    <button
                                                                        className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            handleViewWinners(
                                                                                election.election_id,
                                                                            );
                                                                        }}
                                                                    >
                                                                        🏆
                                                                        Winners
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
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
                // ✅ GRID VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredElections.map((election: Election) => {
                        const status = getElectionStatus(election);
                        const StatusIcon = status.icon;
                        const typeInfo = ELECTION_TYPES[election.election_type];
                        const TypeIcon = typeInfo?.icon || Building2;
                        const courseDisplay = getCourseDisplay(election.course);

                        return (
                            <Card
                                key={election.election_id}
                                className="group border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                onClick={() =>
                                    handleViewElection(election.election_id)
                                }
                            >
                                <div
                                    className={`h-1.5 ${typeInfo?.color || "bg-gray-600"}`}
                                />
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-9 h-9 rounded-xl ${typeInfo?.bgColor || "bg-gray-100"} flex items-center justify-center`}
                                            >
                                                <TypeIcon className="w-4 h-4" />
                                            </div>
                                            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                                                {election.title}
                                            </CardTitle>
                                        </div>
                                        <Badge className={status.color}>
                                            <StatusIcon className="w-3 h-3 mr-1" />
                                            {status.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-600 text-sm line-clamp-2">
                                        {election.description ||
                                            "No description provided"}
                                    </p>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {new Date(
                                            election.voting_start,
                                        ).toLocaleDateString()}{" "}
                                        -{" "}
                                        {new Date(
                                            election.voting_end,
                                        ).toLocaleDateString()}
                                    </div>
                                    {courseDisplay && (
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {courseDisplay}
                                        </Badge>
                                    )}
                                    <div className="flex gap-2 pt-2 flex-wrap">
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-2 group-hover:border-blue-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewElection(
                                                    election.election_id,
                                                );
                                            }}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />{" "}
                                            View Details
                                        </Button>
                                        {status.label === "Ongoing" && (
                                            <Button
                                                variant="default"
                                                className="flex-1 bg-blue-600 hover:from-blue-700 hover:to-indigo-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewResults(
                                                        election.election_id,
                                                    );
                                                }}
                                            >
                                                Live Results
                                            </Button>
                                        )}
                                        {status.label === "Ended" && (
                                            <>
                                                <Button
                                                    variant="secondary"
                                                    className="flex-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewResults(
                                                            election.election_id,
                                                        );
                                                    }}
                                                >
                                                    Results
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewWinners(
                                                            election.election_id,
                                                        );
                                                    }}
                                                >
                                                    <Trophy className="w-4 h-4 mr-2" />{" "}
                                                    Winners
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ElectionsList;
