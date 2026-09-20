// resources/js/pages/Dashboard/CandidateDashboard.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useAuth } from "../contexts/AuthContext";
import { candidateAPI } from "../api/candidates";
import { electionAPI } from "../api/elections";
import { campaignScheduleAPI } from "../api/campaignschedules";
import type { Election as ApiElection } from "../types";
import {
    User,
    FileText,
    TrendingUp,
    CheckCircle,
    Loader2,
    Award,
    Edit,
    Save,
    X,
    Sparkles,
    Users,
    Target,
    Eye,
    Trophy,
    AlertCircle,
    Calendar,
    Clock,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Building2,
    List,
    LayoutGrid,
} from "lucide-react";

// Types
interface UserType {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    student_id: string;
    course: string | { course_code: string; course_name: string };
    year_level: number;
    face_reference_photo?: string;
}

interface Position {
    position_id: number;
    title: string;
}

interface Candidate {
    candidate_id: number;
    user_id: number;
    position_id: number;
    partylist_id?: number;
    platform?: string;
    qualifications?: string;
    is_approved: boolean;
    user?: UserType;
    position?: Position;
}

interface DashboardElection extends ApiElection {
    turnout_percentage?: number;
}

interface CampaignSchedule {
    schedule_id: number;
    election_id: number;
    section_id: number;
    start_time: string;
    end_time: string;
    candidate_id: number | null;
    notes: string | null;
    status: "pending" | "ongoing" | "completed" | "cancelled";
    created_by_user_id: number;
    created_at: string;
    updated_at: string;
    candidate?: {
        candidate_id: number;
        user_id: number;
        user?: {
            user_id: number;
            first_name: string;
            last_name: string;
        };
        position?: {
            position_id: number;
            title: string;
        };
    };
    section?: {
        section_id: number;
        section_code: string;
        section_name: string;
        year_level: number;
        course_id: number;
        course?: {
            course_id: number;
            course_code: string;
            course_name: string;
        };
    };
}

type ViewMode = "list" | "grid";

const getImageUrl = (path?: string): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/storage")) return path;
    return `${path}`;
};

// ===== CALENDAR COMPONENT =====
interface CalendarProps {
    schedules: CampaignSchedule[];
    currentMonth: number;
    currentYear: number;
    onMonthChange: (month: number) => void;
    onDateClick?: (date: number, events: CampaignSchedule[]) => void;
}

const CandidateCalendar: React.FC<CalendarProps> = ({
    schedules,
    currentMonth,
    currentYear,
    onMonthChange,
    onDateClick,
}) => {
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [events, setEvents] = useState<Record<number, CampaignSchedule[]>>(
        {},
    );

    useEffect(() => {
        const grouped: Record<number, CampaignSchedule[]> = {};
        schedules.forEach((schedule) => {
            const start = new Date(schedule.start_time);
            const day = start.getDate();
            if (
                start.getMonth() === currentMonth - 1 &&
                start.getFullYear() === currentYear
            ) {
                if (!grouped[day]) grouped[day] = [];
                grouped[day].push(schedule);
            }
        });
        setEvents(grouped);
    }, [schedules, currentMonth, currentYear]);

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ongoing":
                return "bg-green-500";
            case "completed":
                return "bg-blue-500";
            case "cancelled":
                return "bg-red-500";
            default:
                return "bg-yellow-500";
        }
    };

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
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        className="text-gray-400 hover:text-gray-600 px-2 py-0.5 text-sm transition-colors"
                        onClick={() => onMonthChange(currentMonth + 1)}
                    >
                        <ChevronRight className="w-4 h-4" />
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
                    const hasEvent = dayEvents && dayEvents.length > 0;

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
                            {hasEvent && !day.isToday && (
                                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                    {dayEvents.map((event, i) => (
                                        <div
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full ${getStatusColor(event.status)}`}
                                        />
                                    ))}
                                </div>
                            )}
                            {day.isToday && hasEvent && (
                                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                    {dayEvents.map((event, i) => (
                                        <div
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full ${getStatusColor(event.status)}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Pending
                </span>
                <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Ongoing
                </span>
                <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Completed
                </span>
                <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Cancelled
                </span>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
                <span className="text-gray-500">
                    📅 {schedules.length} schedule
                    {schedules.length !== 1 ? "s" : ""}
                </span>
                <span className="text-blue-600 font-medium">
                    {schedules.filter((s) => s.status === "ongoing").length}{" "}
                    ongoing
                </span>
            </div>
        </div>
    );
};

// ===== SCHEDULE LIST COMPONENT =====
interface ScheduleListProps {
    schedules: CampaignSchedule[];
    viewMode: ViewMode;
}

const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, viewMode }) => {
    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; color: string }> = {
            pending: {
                label: "Pending",
                color: "bg-yellow-100 text-yellow-800",
            },
            ongoing: { label: "Ongoing", color: "bg-green-100 text-green-800" },
            completed: {
                label: "Completed",
                color: "bg-blue-100 text-blue-800",
            },
            cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
        };
        return config[status] || config.pending;
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (schedules.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No campaign schedules yet</p>
                <p className="text-sm mt-1">
                    Your schedules will appear here once approved
                </p>
            </div>
        );
    }

    if (viewMode === "list") {
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3 text-left font-semibold text-gray-700">
                                Date
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-700">
                                Time
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-700">
                                Section
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-700">
                                Status
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-700">
                                Notes
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {schedules.map((schedule) => {
                            const status = getStatusBadge(schedule.status);
                            return (
                                <tr
                                    key={schedule.schedule_id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="p-3 font-medium">
                                        {formatDate(schedule.start_time)}
                                    </td>
                                    <td className="p-3">
                                        {formatTime(schedule.start_time)} -{" "}
                                        {formatTime(schedule.end_time)}
                                    </td>
                                    <td className="p-3">
                                        {schedule.section?.course
                                            ?.course_code || "N/A"}{" "}
                                        - Year{" "}
                                        {schedule.section?.year_level || "N/A"}
                                        Section{" "}
                                        {schedule.section?.section_code ||
                                            "N/A"}
                                    </td>
                                    <td className="p-3">
                                        <Badge className={status.color}>
                                            {status.label}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-gray-500">
                                        {schedule.notes || "-"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    // Grid view
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((schedule) => {
                const status = getStatusBadge(schedule.status);
                return (
                    <div
                        key={schedule.schedule_id}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-gray-900">
                                    {formatDate(schedule.start_time)}
                                </span>
                            </div>
                            <Badge className={status.color}>
                                {status.label}
                            </Badge>
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>
                                    {formatTime(schedule.start_time)} -{" "}
                                    {formatTime(schedule.end_time)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>
                                    {schedule.section?.course?.course_code ||
                                        "N/A"}{" "}
                                    - Year{" "}
                                    {schedule.section?.year_level || "N/A"}
                                    Section{" "}
                                    {schedule.section?.section_code || "N/A"}
                                </span>
                            </div>
                            {schedule.notes && (
                                <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <span className="text-gray-500">
                                        {schedule.notes}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ===== MAIN CANDIDATE DASHBOARD =====
const CandidateDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState<Candidate[]>([]);
    const [activeElection, setActiveElection] =
        useState<DashboardElection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(
        null,
    );
    const [editForm, setEditForm] = useState({
        platform: "",
        qualifications: "",
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editSuccess, setEditSuccess] = useState("");
    const [editError, setEditError] = useState("");

    // Calendar and Schedule state
    const [schedules, setSchedules] = useState<CampaignSchedule[]>([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDateEvents, setSelectedDateEvents] = useState<{
        date: number;
        events: CampaignSchedule[];
    } | null>(null);
    const [scheduleViewMode, setScheduleViewMode] = useState<ViewMode>("list");
    const [isCalendarVisible, setIsCalendarVisible] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeElection && activeElection.election_id) {
            fetchSchedules(activeElection.election_id);
        }
    }, [activeElection]);

    const fetchData = async (): Promise<void> => {
        setLoading(true);
        setError("");
        try {
            // Fetch active election
            try {
                const electionRes = await electionAPI.getActive();
                const electionData = electionRes.data || null;
                setActiveElection(electionData as DashboardElection | null);

                if (electionData) {
                    // Fetch candidates for this election
                    const candidatesRes = await candidateAPI.getByElection(
                        electionData.election_id,
                    );
                    const allCandidates = candidatesRes.data || [];
                    const userApplications = allCandidates.filter(
                        (c: Candidate) => c.user_id === user?.user_id,
                    );
                    setApplications(userApplications);
                }
            } catch (err: any) {
                if (err.response?.status !== 404) {
                    console.error("Failed to fetch active election:", err);
                    setError("Unable to load election data");
                }
            }
        } catch (error) {
            console.error("Failed to fetch candidate data:", error);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedules = async (electionId: number) => {
        setLoadingSchedules(true);
        try {
            const response = await campaignScheduleAPI.getByCandidate(
                applications[0]?.candidate_id || 0,
            );
            let schedulesData: CampaignSchedule[] = [];
            if (response.data?.data) {
                schedulesData = response.data.data;
            } else if (Array.isArray(response.data)) {
                schedulesData = response.data;
            }
            setSchedules(schedulesData);
        } catch (error) {
            console.error("Failed to fetch schedules:", error);
            setSchedules([]);
        } finally {
            setLoadingSchedules(false);
        }
    };

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

    const handleDateClick = (date: number, events: CampaignSchedule[]) => {
        setSelectedDateEvents({ date, events });
        setTimeout(() => setSelectedDateEvents(null), 5000);
    };

    const handleEditProfile = (candidate: Candidate): void => {
        setEditingCandidate(candidate);
        setEditForm({
            platform: candidate.platform || "",
            qualifications: candidate.qualifications || "",
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveProfile = async (): Promise<void> => {
        if (!editingCandidate) return;
        setEditLoading(true);
        setEditError("");
        setEditSuccess("");
        try {
            await candidateAPI.update(editingCandidate.candidate_id, {
                platform: editForm.platform,
                qualifications: editForm.qualifications,
            });
            setEditSuccess("Profile updated successfully!");
            setTimeout(() => {
                setIsEditDialogOpen(false);
                fetchData();
            }, 2000);
        } catch (error: any) {
            setEditError(
                error.response?.data?.message || "Failed to update profile",
            );
        } finally {
            setEditLoading(false);
        }
    };

    const getInitials = (): string => {
        if (!user) return "U";
        return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
    };

    const profilePhoto = getImageUrl(user?.face_reference_photo);
    const approvedApplication = applications.find((a) => a.is_approved);
    const turnoutPercentage = activeElection?.turnout_percentage || 0;

    // Filter schedules by status
    const filteredSchedules = useMemo(() => {
        if (filterStatus === "all") return schedules;
        return schedules.filter((s) => s.status === filterStatus);
    }, [schedules, filterStatus]);

    // Get schedule stats
    const scheduleStats = useMemo(() => {
        const total = schedules.length;
        const pending = schedules.filter((s) => s.status === "pending").length;
        const ongoing = schedules.filter((s) => s.status === "ongoing").length;
        const completed = schedules.filter(
            (s) => s.status === "completed",
        ).length;
        const cancelled = schedules.filter(
            (s) => s.status === "cancelled",
        ).length;
        return { total, pending, ongoing, completed, cancelled };
    }, [schedules]);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        <Loader2 className="relative w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    </div>
                    <p className="text-gray-600 font-medium">
                        Loading your campaign data...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <Badge className="bg-white/15 text-white border-0">
                            Candidate Portal
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Hello, {user?.first_name}! 👋
                    </h1>
                    <p className="text-white mt-1">
                        Manage your campaign and view your schedules
                    </p>
                </div>
            </div>

            {/* Stats - Pill/Badge Style */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Applications
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {applications.length}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">
                        Active Election
                    </span>
                    <span className="text-sm font-bold text-indigo-800">
                        {activeElection ? "Yes" : "No"}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">
                        Voter Turnout
                    </span>
                    <span className="text-sm font-bold text-orange-800">
                        {turnoutPercentage}%
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                        Schedules
                    </span>
                    <span className="text-sm font-bold text-purple-800">
                        {scheduleStats.total}
                    </span>
                </div>
                {scheduleStats.pending > 0 && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">
                            Pending Schedules
                        </span>
                        <span className="text-sm font-bold text-yellow-800">
                            {scheduleStats.pending}
                        </span>
                    </div>
                )}
                {scheduleStats.ongoing > 0 && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            Ongoing Schedules
                        </span>
                        <span className="text-sm font-bold text-green-800">
                            {scheduleStats.ongoing}
                        </span>
                    </div>
                )}
            </div>

            {/* Error Alert */}
            {error && (
                <Card className="border-red-200 bg-red-50 rounded-xl">
                    <CardContent className="p-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <p className="text-red-600 text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Main Tabs */}
            <Tabs defaultValue="my-campaign" className="space-y-4">
                <TabsList className="bg-gray-100 p-1 rounded-xl flex-wrap">
                    <TabsTrigger
                        value="my-campaign"
                        className="rounded-lg data-[state=active]:text-white data-[state=active]:bg-blue-600"
                    >
                        <Award className="w-4 h-4 mr-2" /> My Campaign
                    </TabsTrigger>
                    <TabsTrigger
                        value="schedule"
                        className="rounded-lg data-[state=active]:text-white data-[state=active]:bg-blue-600"
                    >
                        <Calendar className="w-4 h-4 mr-2" /> Schedule
                        {scheduleStats.pending > 0 && (
                            <Badge className="ml-2 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5">
                                {scheduleStats.pending}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* My Campaign Tab Content */}
                <TabsContent value="my-campaign">
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <CardHeader className="bg-gray-50 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-purple-600" /> My
                                Campaign Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Profile Header */}
                            <div className="flex flex-col md:flex-row gap-6 pb-6 border-b">
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative">
                                        <Avatar className="w-28 h-28 ring-4 ring-purple-100 shadow-xl">
                                            <AvatarImage
                                                src={profilePhoto || undefined}
                                            />
                                            <AvatarFallback className="bg-blue-600 text-white text-3xl font-bold">
                                                {getInitials()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {approvedApplication && (
                                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <Badge className="mt-3 bg-blue-100 text-blue-700 border-0">
                                        Candidate
                                    </Badge>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {user?.first_name} {user?.last_name}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                                        <Badge
                                            variant="outline"
                                            className="bg-gray-50"
                                        >
                                            ID: {user?.student_id}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="bg-gray-50"
                                        >
                                            {typeof user?.course === "object"
                                                ? user?.course?.course_code
                                                : user?.course}{" "}
                                            - Year {user?.year_level}
                                        </Badge>
                                    </div>
                                    <p className="text-gray-500 text-sm mt-2">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            {/* Campaign Details */}
                            {approvedApplication ? (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-green-600" />{" "}
                                            Running for:
                                        </h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleEditProfile(
                                                    approvedApplication,
                                                )
                                            }
                                            className="rounded-xl border-purple-200 text-indigo-600 hover:bg-purple-50"
                                        >
                                            <Edit className="w-4 h-4 mr-1" />{" "}
                                            Edit Profile
                                        </Button>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                                <Trophy className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-lg text-gray-900">
                                                    {
                                                        approvedApplication
                                                            .position?.title
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        {approvedApplication.platform && (
                                            <div className="mt-4 pt-4 border-t border-purple-100">
                                                <p className="text-sm font-medium text-gray-700 mb-1">
                                                    Platform
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {
                                                        approvedApplication.platform
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {approvedApplication.qualifications && (
                                            <div className="mt-3 pt-3 border-t border-purple-100">
                                                <p className="text-sm font-medium text-gray-700 mb-1">
                                                    Qualifications
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {
                                                        approvedApplication.qualifications
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto mt-3 text-blue-600 hover:text-indigo-700"
                                            onClick={() =>
                                                navigate(
                                                    `/candidates/${approvedApplication.candidate_id}`,
                                                )
                                            }
                                        >
                                            <Eye className="w-4 h-4 mr-1" />{" "}
                                            View Public Profile
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-6 text-center py-8 bg-gray-50 rounded-xl">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Award className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium">
                                        You are not running in any election yet
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Apply for candidacy from your voter
                                        dashboard
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Schedule Tab Content */}
                <TabsContent value="schedule">
                    <div className="space-y-4">
                        {/* Schedule Stats - Pill/Badge Style */}
                        <div className="flex flex-wrap items-center gap-3 py-1">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-600">
                                    Total
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                    {scheduleStats.total}
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                                <Clock className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-700">
                                    Pending
                                </span>
                                <span className="text-sm font-bold text-yellow-800">
                                    {scheduleStats.pending}
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                    Ongoing
                                </span>
                                <span className="text-sm font-bold text-green-800">
                                    {scheduleStats.ongoing}
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">
                                    Completed
                                </span>
                                <span className="text-sm font-bold text-blue-800">
                                    {scheduleStats.completed}
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                                <X className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-red-700">
                                    Cancelled
                                </span>
                                <span className="text-sm font-bold text-red-800">
                                    {scheduleStats.cancelled}
                                </span>
                            </div>
                        </div>

                        {/* Filter and View Controls */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-700">
                                            Filter:
                                        </span>
                                        <div className="flex gap-1.5">
                                            {[
                                                "all",
                                                "pending",
                                                "ongoing",
                                                "completed",
                                                "cancelled",
                                            ].map((status) => (
                                                <button
                                                    key={status}
                                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                                        filterStatus === status
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                                    onClick={() =>
                                                        setFilterStatus(status)
                                                    }
                                                >
                                                    {status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        status.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                            <button
                                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                                    scheduleViewMode === "list"
                                                        ? "bg-blue-600 text-white"
                                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                                }`}
                                                onClick={() =>
                                                    setScheduleViewMode("list")
                                                }
                                            >
                                                <List className="w-4 h-4" />
                                                List
                                            </button>
                                            <button
                                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                                    scheduleViewMode === "grid"
                                                        ? "bg-blue-600 text-white"
                                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                                }`}
                                                onClick={() =>
                                                    setScheduleViewMode("grid")
                                                }
                                            >
                                                <LayoutGrid className="w-4 h-4" />
                                                Grid
                                            </button>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setIsCalendarVisible(
                                                    !isCalendarVisible,
                                                )
                                            }
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                                isCalendarVisible
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            {isCalendarVisible
                                                ? "Hide Calendar"
                                                : "Show Calendar"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calendar and Schedules Grid */}
                        <div
                            className={`grid grid-cols-1 ${isCalendarVisible ? "lg:grid-cols-[1.6fr_1fr]" : ""} gap-6`}
                        >
                            {/* Schedules List */}
                            <div
                                className={
                                    !isCalendarVisible ? "lg:col-span-full" : ""
                                }
                            >
                                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                                    <CardHeader className="bg-gray-50 border-b">
                                        <CardTitle className="flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                                Your Campaign Schedules
                                                <Badge className="bg-blue-100 text-blue-700">
                                                    {filteredSchedules.length}{" "}
                                                    schedules
                                                </Badge>
                                            </span>
                                            {loadingSchedules && (
                                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <ScheduleList
                                            schedules={filteredSchedules}
                                            viewMode={scheduleViewMode}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Calendar */}
                            {isCalendarVisible && (
                                <div>
                                    <CandidateCalendar
                                        schedules={schedules}
                                        currentMonth={currentMonth}
                                        currentYear={currentYear}
                                        onMonthChange={handleMonthChange}
                                        onDateClick={handleDateClick}
                                    />

                                    {/* Selected Date Events */}
                                    {selectedDateEvents &&
                                        selectedDateEvents.events.length >
                                            0 && (
                                            <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                                <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    Events on{" "}
                                                    {selectedDateEvents.date}:
                                                </p>
                                                <div className="space-y-1.5">
                                                    {selectedDateEvents.events.map(
                                                        (event, idx) => {
                                                            const statusColor =
                                                                {
                                                                    pending:
                                                                        "bg-yellow-500",
                                                                    ongoing:
                                                                        "bg-green-500",
                                                                    completed:
                                                                        "bg-blue-500",
                                                                    cancelled:
                                                                        "bg-red-500",
                                                                }[
                                                                    event.status
                                                                ] ||
                                                                "bg-gray-500";
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center gap-2 text-xs py-1.5 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <div
                                                                        className={`w-2 h-2 rounded-full ${statusColor}`}
                                                                    />
                                                                    <span className="text-gray-700 font-medium">
                                                                        {event
                                                                            .section
                                                                            ?.course
                                                                            ?.course_code ||
                                                                            "N/A"}{" "}
                                                                        -
                                                                        Section{" "}
                                                                        {event
                                                                            .section
                                                                            ?.section_code ||
                                                                            "N/A"}
                                                                    </span>
                                                                    <span className="text-gray-400">
                                                                        {new Date(
                                                                            event.start_time,
                                                                        ).toLocaleTimeString(
                                                                            [],
                                                                            {
                                                                                hour: "2-digit",
                                                                                minute: "2-digit",
                                                                            },
                                                                        )}
                                                                    </span>
                                                                    <Badge className="text-[10px]">
                                                                        {
                                                                            event.status
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <Edit className="w-5 h-5 text-purple-600" /> Edit
                            Campaign Profile
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 mt-2">
                        {editSuccess && (
                            <Alert className="bg-green-50 border-green-200 rounded-xl">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-600">
                                    {editSuccess}
                                </AlertDescription>
                            </Alert>
                        )}
                        {editError && (
                            <Alert variant="destructive" className="rounded-xl">
                                <AlertDescription>{editError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">
                                Campaign Platform
                            </Label>
                            <Textarea
                                placeholder="What are your goals and plans if elected? Describe your platform..."
                                value={editForm.platform}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        platform: e.target.value,
                                    })
                                }
                                rows={5}
                                className="rounded-xl border-2 focus:border-purple-500"
                            />
                            <p className="text-xs text-gray-500">
                                Be specific about what you want to achieve for
                                the student body
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">
                                Qualifications & Achievements
                            </Label>
                            <Textarea
                                placeholder="List your qualifications, leadership experience, achievements, and awards..."
                                value={editForm.qualifications}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        qualifications: e.target.value,
                                    })
                                }
                                rows={4}
                                className="rounded-xl border-2 focus:border-purple-500"
                            />
                            <p className="text-xs text-gray-500">
                                Include academic achievements, leadership roles,
                                awards, and relevant experience
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                className="rounded-xl"
                            >
                                <X className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                            <Button
                                onClick={handleSaveProfile}
                                disabled={editLoading}
                                className="bg-green-600 hover:bg-green-700 rounded-xl"
                            >
                                {editLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}{" "}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CandidateDashboard;