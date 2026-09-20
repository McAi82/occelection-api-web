// resources/js/pages/Dashboard/VoterDashboard.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    useVoterDashboardStats,
    useRefreshVoterDashboard,
} from "../hooks/useDashboard";
import { useMyApplications } from "../hooks/useApplications";
import { RefreshButton } from "../components/common/RefreshButton";
import type { Election as ApiElection } from "../types";
import {
    Calendar,
    Vote,
    Users,
    Building2,
    Eye,
    Sparkles,
    ArrowRight,
    CheckCircle,
    Clock,
    Download,
    Activity,
    FileText,
    UserPlus,
    List,
    LayoutGrid,
    ChevronRight,
    UserCheck,
    CalendarDays,
    Zap,
    MessageCircle,
    ChevronUp,
    ChevronDown,
    Calendar as CalendarIcon,
} from "lucide-react";

import CandidacyApplicationForm from "../components/CandidacyApplicationForm";

type ViewMode = "list" | "grid";

// ===== CALENDAR COMPONENT =====
interface CalendarProps {
    elections: any[];
    currentMonth: number;
    currentYear: number;
    onMonthChange: (month: number) => void;
    onDateClick?: (date: number, events: any[]) => void;
}

const VoterCalendar: React.FC<CalendarProps> = ({
    elections,
    currentMonth,
    currentYear,
    onMonthChange,
    onDateClick,
}) => {
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [events, setEvents] = useState<Record<number, any[]>>({});

    useEffect(() => {
        const grouped: Record<number, any[]> = {};
        elections.forEach((election: any) => {
            const start = new Date(election.voting_start);
            const end = new Date(election.voting_end);

            if (
                start.getMonth() === currentMonth - 1 &&
                start.getFullYear() === currentYear
            ) {
                const startDay = start.getDate();
                if (!grouped[startDay]) grouped[startDay] = [];
                grouped[startDay].push({
                    ...election,
                    type: "start",
                    date: start,
                });
            }

            if (
                end.getMonth() === currentMonth - 1 &&
                end.getFullYear() === currentYear
            ) {
                const endDay = end.getDate();
                const existingStart = grouped[endDay]?.some(
                    (e: any) => e.type === "start",
                );
                if (!existingStart || endDay !== start.getDate()) {
                    if (!grouped[endDay]) grouped[endDay] = [];
                    grouped[endDay].push({
                        ...election,
                        type: "end",
                        date: end,
                    });
                } else {
                    const existing = grouped[endDay].find(
                        (e: any) => e.election_id === election.election_id,
                    );
                    if (existing) {
                        existing.type = "both";
                    }
                }
            }
        });
        setEvents(grouped);
    }, [elections, currentMonth, currentYear]);

    const getCalendarDays = () => {
        const days = [];
        const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            days.push({ day: null, empty: true });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday =
                d === new Date().getDate() &&
                currentMonth === new Date().getMonth() + 1 &&
                currentYear === new Date().getFullYear();
            const hasEvent = events[d] && events[d].length > 0;
            const isSelected = selectedDate === d;
            days.push({ day: d, empty: false, isToday, hasEvent, isSelected });
        }
        return days;
    };

    const calendarDays = getCalendarDays();

    const handleDayClick = (day: number) => {
        setSelectedDate(selectedDate === day ? null : day);
        if (onDateClick && events[day]) {
            onDateClick(day, events[day]);
        }
    };

    const getElectionStats = () => {
        const monthElections = elections.filter((e: any) => {
            const start = new Date(e.voting_start);
            const end = new Date(e.voting_end);
            return (
                (start.getMonth() === currentMonth - 1 &&
                    start.getFullYear() === currentYear) ||
                (end.getMonth() === currentMonth - 1 &&
                    end.getFullYear() === currentYear)
            );
        });
        const ongoing = monthElections.filter((e: any) => {
            const start = new Date(e.voting_start);
            const end = new Date(e.voting_end);
            const now = new Date();
            return now >= start && now <= end;
        });
        return { total: monthElections.length, ongoing: ongoing.length };
    };

    const stats = getElectionStats();

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-extrabold text-gray-900">
                    {new Date(currentYear, currentMonth - 1).toLocaleString(
                        "default",
                        { month: "long" },
                    )}{" "}
                    {currentYear}
                </span>
                <div className="flex gap-1">
                    <button
                        className="text-gray-400 hover:text-gray-600 px-2 py-0.5 text-sm transition-colors"
                        onClick={() => onMonthChange(currentMonth - 1)}
                    >
                        ‹
                    </button>
                    <button
                        className="text-gray-400 hover:text-gray-600 px-2 py-0.5 text-sm transition-colors"
                        onClick={() => onMonthChange(currentMonth + 1)}
                    >
                        ›
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div
                        key={day}
                        className="text-[11px] font-bold text-gray-400 pb-1"
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDays.map((day, idx) => {
                    const dayEvents = day.day ? events[day.day] : [];
                    const hasStart =
                        dayEvents?.some(
                            (e: any) => e.type === "start" || e.type === "both",
                        ) || false;
                    const hasEnd =
                        dayEvents?.some(
                            (e: any) => e.type === "end" || e.type === "both",
                        ) || false;

                    return (
                        <div
                            key={idx}
                            className={`
                                relative text-sm py-1.5 rounded-lg font-semibold cursor-pointer transition-all
                                ${day.empty ? "text-gray-300 opacity-40 cursor-default" : ""}
                                ${day.isToday ? "bg-blue-600 text-white shadow-sm" : ""}
                                ${day.isSelected && !day.isToday ? "bg-blue-100 text-blue-600 ring-2 ring-blue-300" : ""}
                                ${!day.empty && !day.isToday && !day.isSelected ? "text-gray-700 hover:bg-gray-100" : ""}
                            `}
                            onClick={() =>
                                !day.empty && day.day && handleDayClick(day.day)
                            }
                        >
                            {day.day}
                            {day.hasEvent && !day.isToday && (
                                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                    {hasStart && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    )}
                                    {hasEnd && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    )}
                                </div>
                            )}
                            {day.isToday && day.hasEvent && (
                                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                    {hasStart && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    )}
                                    {hasEnd && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/70"></div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Start Date
                </span>
                <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    End Date
                </span>
                <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    Today
                </span>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
                <span className="text-gray-500">
                    📅 {stats.total} elections this month
                </span>
                <span className="text-green-600 font-medium">
                    🟢 {stats.ongoing} ongoing
                </span>
            </div>
        </div>
    );
};

// ===== HELPER FUNCTIONS =====
const getCourseDisplay = (course?: ApiElection["course"]): string => {
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

const getElectionStatus = (
    election: ApiElection,
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

const ELECTION_TYPES: Record<
    string,
    { name: string; icon: React.ElementType; color: string; bgColor: string }
> = {
    CSG: {
        name: "Central Student Government",
        icon: Building2,
        color: "bg-blue-600",
        bgColor: "bg-blue-100",
    },
    SBO: {
        name: "Student Body Organization",
        icon: Users,
        color: "bg-green-600",
        bgColor: "bg-green-100",
    },
};

const getApplicationStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
        pending: {
            label: "Pending Admin Review",
            color: "bg-yellow-100 text-yellow-800",
        },
        admin_approved: {
            label: "Admin Approved - Pending COMELEC",
            color: "bg-blue-100 text-blue-800",
        },
        comelec_approved: {
            label: "Approved as Candidate 🎉",
            color: "bg-green-100 text-green-800",
        },
        rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
    };
    return (
        config[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    );
};

const VoterDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState("all");
    const [showCandidacyForm, setShowCandidacyForm] = useState(false);
    const [selectedElectionId, setSelectedElectionId] = useState<number | null>(
        null,
    );
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDateEvents, setSelectedDateEvents] = useState<{
        date: number;
        events: any[];
    } | null>(null);

    const [isCalendarVisible, setIsCalendarVisible] = useState(false);

    const {
        data: statsData,
        isLoading: statsLoading,
        refetch: refetchStats,
        isFetching: isStatsFetching,
    } = useVoterDashboardStats();

    const refreshDashboard = useRefreshVoterDashboard();

    const {
        data: myApplications = [],
        isLoading: appsLoading,
        refetch: refetchApplications,
    } = useMyApplications();

    const handleMonthChange = (month: number) => {
        if (month < 1) {
            setCurrentMonth(12);
            setCurrentYear((prev) => prev - 1);
        } else if (month > 12) {
            setCurrentMonth(1);
            setCurrentYear((prev) => prev + 1);
        } else {
            setCurrentMonth(month);
        }
    };

    const handleDateClick = (date: number, events: any[]) => {
        setSelectedDateEvents({ date, events });
        setTimeout(() => setSelectedDateEvents(null), 5000);
    };

    const toggleCalendar = () => {
        setIsCalendarVisible((prev) => !prev);
    };

    const applicationStatus = useMemo(() => {
        const activeApp = myApplications.find(
            (a: any) =>
                a.admin_status !== "rejected" &&
                a.comelec_status !== "rejected",
        );
        if (activeApp) {
            if (activeApp.comelec_status === "approved")
                return "comelec_approved";
            else if (activeApp.admin_status === "approved")
                return "admin_approved";
            else if (activeApp.admin_status === "pending") return "pending";
        }
        return null;
    }, [myApplications]);

    const elections = statsData?.elections || [];
    const stats = {
        totalElections: statsData?.totalElections || 0,
        ongoingCount: statsData?.ongoingCount || 0,
        upcomingCount: statsData?.upcomingCount || 0,
    };

    const filteredElections = useMemo(() => {
        if (activeFilter === "all") return elections;
        return elections.filter(
            (e: ApiElection) => e.election_type === activeFilter,
        );
    }, [elections, activeFilter]);

    const handleRefresh = async () => {
        await refetchStats();
        await refetchApplications();
        refreshDashboard();
    };

    const handleApplyCandidacy = (electionId: number) => {
        window.open(`/apply-candidacy/${electionId}`, "_blank");
    };

    const handleViewResults = (electionId: number): void => {
        navigate(`/elections/${electionId}/live-results`);
    };

    const isLoading = statsLoading || appsLoading;

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        <div className="relative w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    </div>
                    <p className="text-gray-600 font-medium">
                        Loading elections...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* HEADER - No Card */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Voter Portal
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                Welcome to OCC Election Portal
                            </h1>
                            <p className="text-blue-100 mt-1">
                                Your voice matters. Participate in student
                                government elections.
                            </p>
                        </div>
                        <RefreshButton
                            onClick={handleRefresh}
                            isLoading={isStatsFetching}
                        />
                    </div>
                </div>
            </div>

            {/* STATS - Pill/Badge Style */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <Vote className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Total Elections
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {stats.totalElections}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        Ongoing
                    </span>
                    <span className="text-sm font-bold text-green-800">
                        {stats.ongoingCount}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                        Upcoming
                    </span>
                    <span className="text-sm font-bold text-yellow-800">
                        {stats.upcomingCount}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                        Candidates
                    </span>
                    <span className="text-sm font-bold text-purple-800">
                        {elections.reduce(
                            (acc: number, e: any) =>
                                acc + (e.candidates?.length || 0),
                            0,
                        )}
                    </span>
                </div>
            </div>

            {/* APPLICATION STATUS - No Card */}
            {applicationStatus && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">
                                    Your Candidacy Application Status
                                </p>
                                <Badge
                                    className={
                                        getApplicationStatusBadge(
                                            applicationStatus,
                                        ).color
                                    }
                                >
                                    {
                                        getApplicationStatusBadge(
                                            applicationStatus,
                                        ).label
                                    }
                                </Badge>
                            </div>
                        </div>
                        <Button
                            className="bg-blue-600 rounded-xl"
                            onClick={() => navigate("/my-applications")}
                        >
                            View Applications
                        </Button>
                    </div>
                </div>
            )}

            {/* MAIN GRID: Elections + Calendar */}
            <div
                className={`grid grid-cols-1 ${isCalendarVisible ? "lg:grid-cols-[1.6fr_1fr]" : ""} gap-6`}
            >
                {/* Left: Elections */}
                <div className={!isCalendarVisible ? "lg:col-span-full" : ""}>
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Active Elections
                            </h2>
                            <p className="text-sm text-gray-500">
                                Cast your vote and make a difference
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleCalendar}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                            >
                                <CalendarIcon className="w-4 h-4" />
                                {isCalendarVisible
                                    ? "Hide Calendar"
                                    : "Show Calendar"}
                                {isCalendarVisible ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                )}
                            </button>
                            <Button
                                variant="link"
                                onClick={() => navigate("/elections")}
                                className="text-blue-600"
                            >
                                View All Elections{" "}
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <Tabs
                            defaultValue="all"
                            value={activeFilter}
                            onValueChange={setActiveFilter}
                        >
                            <TabsList className="bg-gray-100 p-1 rounded-xl">
                                <TabsTrigger
                                    value="all"
                                    className="rounded-lg data-[state=active]:bg-sky-500 data-[state=active]:text-white"
                                >
                                    All
                                </TabsTrigger>
                                <TabsTrigger
                                    value="CSG"
                                    className="rounded-lg data-[state=active]:bg-sky-500 data-[state=active]:text-white"
                                >
                                    CSG
                                </TabsTrigger>
                                <TabsTrigger
                                    value="SBO"
                                    className="rounded-lg data-[state=active]:bg-sky-500 data-[state=active]:text-white"
                                >
                                    SBO
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                            <button
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"}`}
                                onClick={() => setViewMode("list")}
                            >
                                <List className="w-4 h-4" /> List
                            </button>
                            <button
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"}`}
                                onClick={() => setViewMode("grid")}
                            >
                                <LayoutGrid className="w-4 h-4" /> Grid
                            </button>
                        </div>
                    </div>

                    {/* Elections List/Grid - No Cards */}
                    {filteredElections.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">
                                No elections available
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                Check back later for upcoming elections
                            </p>
                        </div>
                    ) : viewMode === "list" ? (
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left p-4 text-xs font-bold text-gray-500">
                                                Election
                                            </th>
                                            <th className="text-left p-4 text-xs font-bold text-gray-500">
                                                Type
                                            </th>
                                            <th className="text-left p-4 text-xs font-bold text-gray-500">
                                                Status
                                            </th>
                                            <th className="text-left p-4 text-xs font-bold text-gray-500">
                                                Date Range
                                            </th>
                                            <th className="text-left p-4 text-xs font-bold text-gray-500">
                                                Course
                                            </th>
                                            <th className="text-right p-4 text-xs font-bold text-gray-500">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredElections
                                            .slice(0, 10)
                                            .map((election: ApiElection) => {
                                                const status =
                                                    getElectionStatus(election);
                                                const StatusIcon = status.icon;
                                                const typeInfo =
                                                    ELECTION_TYPES[
                                                        election.election_type
                                                    ];
                                                const TypeIcon =
                                                    typeInfo?.icon || Building2;
                                                const hasApplied =
                                                    myApplications.some(
                                                        (a: any) =>
                                                            a.election_id ===
                                                            election.election_id,
                                                    );
                                                const courseDisplay =
                                                    getCourseDisplay(
                                                        election.course,
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            election.election_id
                                                        }
                                                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                                        onClick={() =>
                                                            navigate(
                                                                `/elections/${election.election_id}`,
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
                                                                <StatusIcon className="w-3 h-3 mr-1" />{" "}
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
                                                                    {
                                                                        courseDisplay
                                                                    }
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">
                                                                    N/A
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-2 flex-wrap">
                                                                {status.label ===
                                                                "Ongoing" ? (
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
                                                                        <Eye className="w-3 h-3 mr-1" />{" "}
                                                                        Live
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            navigate(
                                                                                `/elections/${election.election_id}`,
                                                                            );
                                                                        }}
                                                                    >
                                                                        View{" "}
                                                                        <ChevronRight className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {!hasApplied &&
                                                                    status.label !==
                                                                        "Ended" && (
                                                                        <button
                                                                            className="text-sm font-bold bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                handleApplyCandidacy(
                                                                                    election.election_id,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <UserPlus className="w-3 h-3 mr-1" />{" "}
                                                                            Apply
                                                                        </button>
                                                                    )}
                                                                {hasApplied && (
                                                                    <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
                                                                        Applied
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredElections
                                .slice(0, 6)
                                .map((election: ApiElection) => {
                                    const status = getElectionStatus(election);
                                    const StatusIcon = status.icon;
                                    const typeInfo =
                                        ELECTION_TYPES[election.election_type];
                                    const TypeIcon =
                                        typeInfo?.icon || Building2;
                                    const hasApplied = myApplications.some(
                                        (a: any) =>
                                            a.election_id ===
                                            election.election_id,
                                    );
                                    const courseDisplay = getCourseDisplay(
                                        election.course,
                                    );

                                    return (
                                        <div
                                            key={election.election_id}
                                            className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
                                            onClick={() =>
                                                navigate(
                                                    `/elections/${election.election_id}`,
                                                )
                                            }
                                        >
                                            <div
                                                className={`h-1 w-12 rounded-full ${typeInfo?.color || "bg-gray-600"} mb-3`}
                                            />
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`w-8 h-8 rounded-lg ${typeInfo?.bgColor || "bg-gray-100"} flex items-center justify-center`}
                                                    >
                                                        <TypeIcon className="w-4 h-4" />
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {election.title}
                                                    </h3>
                                                </div>
                                                <Badge className={status.color}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />{" "}
                                                    {status.label}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                                {election.description ||
                                                    "No description provided"}
                                            </p>
                                            <div className="flex items-center text-sm text-gray-500 mt-3">
                                                <Calendar className="w-4 h-4 mr-2" />{" "}
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
                                                    className="text-xs mt-2"
                                                >
                                                    {courseDisplay}
                                                </Badge>
                                            )}
                                            <div className="flex gap-2 pt-3 mt-3 border-t border-gray-100 flex-wrap">
                                                {status.label === "Ongoing" ? (
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 border-2 rounded-xl text-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewResults(
                                                                election.election_id,
                                                            );
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />{" "}
                                                        Live
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 border-2 rounded-xl text-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(
                                                                `/elections/${election.election_id}`,
                                                            );
                                                        }}
                                                    >
                                                        View Details
                                                    </Button>
                                                )}
                                                {!hasApplied &&
                                                    status.label !==
                                                        "Ended" && (
                                                        <Button
                                                            variant="default"
                                                            className="bg-purple-600 hover:bg-purple-700 rounded-xl text-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleApplyCandidacy(
                                                                    election.election_id,
                                                                );
                                                            }}
                                                        >
                                                            <UserPlus className="w-4 h-4 mr-2" />{" "}
                                                            Apply
                                                        </Button>
                                                    )}
                                                {hasApplied && (
                                                    <Badge className="bg-blue-100 text-blue-800 border-0">
                                                        Applied
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>

                {/* Right: Calendar - Conditionally Rendered */}
                {isCalendarVisible && (
                    <div>
                        <VoterCalendar
                            elections={elections}
                            currentMonth={currentMonth}
                            currentYear={currentYear}
                            onMonthChange={handleMonthChange}
                            onDateClick={handleDateClick}
                        />

                        {/* Selected Date Events */}
                        {selectedDateEvents &&
                            selectedDateEvents.events.length > 0 && (
                                <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        Events on {selectedDateEvents.date}:
                                    </p>
                                    <div className="space-y-1.5">
                                        {selectedDateEvents.events.map(
                                            (event: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 text-xs py-1.5 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${event.type === "start" ? "bg-green-500" : event.type === "end" ? "bg-red-500" : "bg-purple-500"}`}
                                                    />
                                                    <span className="text-gray-700 font-medium">
                                                        {event.title}
                                                    </span>
                                                    <span
                                                        className={`text-gray-400 ${event.type === "start" ? "text-green-600" : event.type === "end" ? "text-red-600" : "text-purple-600"}`}
                                                    >
                                                        (
                                                        {event.type === "start"
                                                            ? "Starts"
                                                            : event.type ===
                                                                "end"
                                                              ? "Ends"
                                                              : "Starts & Ends"}
                                                        )
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                )}
            </div>

            {/* QUICK LINKS - No Cards */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" /> Quick Links
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => navigate("/candidates")}
                    >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Candidates
                            </p>
                            <p className="text-xs text-gray-400">
                                View profiles
                            </p>
                        </div>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => navigate("/partylists")}
                    >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Partylists
                            </p>
                            <p className="text-xs text-gray-400">
                                Browse partylists
                            </p>
                        </div>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => navigate("/timeline")}
                    >
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Timeline
                            </p>
                            <p className="text-xs text-gray-400">
                                Campaign posts
                            </p>
                        </div>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => navigate("/download-app")}
                    >
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Download className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Mobile App
                            </p>
                            <p className="text-xs text-gray-400">
                                Download now
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CANDIDACY MODAL */}
            <Dialog
                open={showCandidacyForm}
                onOpenChange={setShowCandidacyForm}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            Application for Candidacy
                        </DialogTitle>
                    </DialogHeader>
                    {selectedElectionId && (
                        <CandidacyApplicationForm
                            electionId={selectedElectionId}
                            electionTitle={
                                elections.find(
                                    (e: ApiElection) =>
                                        e.election_id === selectedElectionId,
                                )?.title
                            }
                            onSuccess={() => {
                                setShowCandidacyForm(false);
                                refetchApplications();
                            }}
                            onCancel={() => setShowCandidacyForm(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VoterDashboard;