// resources/js/pages/Admin/Dashboard/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    Users,
    Calendar,
    TrendingUp,
    Plus,
    Upload,
    UserPlus,
    BarChart3,
    Loader2,
    Clock,
    CheckCircle,
    AlertCircle,
    Building2,
    XCircle,
} from "lucide-react";
import { useElections, useRefreshElections } from "../hooks/useElections";
import { useAuth } from "../contexts/AuthContext";
import { adminAPI } from "../api/admin";
import { monitoringAPI } from "../api/monitoring";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface DashboardStats {
    totalElections: number;
    activeElections: number;
    totalVoters: number;
    turnoutPercentage: number;
}

// ===== ELECTION TYPE CONSTANTS =====
interface ElectionType {
    id: string;
    name: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    avatarColor: string;
}

const ELECTION_TYPES: Record<string, ElectionType> = {
    CSG: {
        id: "CSG",
        name: "Central Student Government",
        icon: Building2,
        color: "bg-blue-600",
        bgColor: "bg-blue-50",
        avatarColor: "blue",
    },
    SBO: {
        id: "SBO",
        name: "Student Body Organization",
        icon: Users,
        color: "bg-green-600",
        bgColor: "bg-green-50",
        avatarColor: "green",
    },
};

const COURSES = [
    {
        id: 1,
        code: "BSIT",
        name: "Bachelor of Science in Information Technology",
    },
    {
        id: 2,
        code: "BSBA",
        name: "Bachelor of Science in Business Administration",
    },
    { id: 3, code: "BEED", name: "Bachelor of Elementary Education" },
];

const formatDateTimeForInput = (date: string | Date): string => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// ===== ENHANCED CALENDAR COMPONENT =====
interface EnhancedCalendarProps {
    elections: any[];
    currentMonth: number;
    currentYear: number;
    onMonthChange: (month: number) => void;
}

const EnhancedCalendar: React.FC<EnhancedCalendarProps> = ({
    elections,
    currentMonth,
    currentYear,
    onMonthChange,
}) => {
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [events, setEvents] = useState<Record<number, any[]>>({});

    useEffect(() => {
        const monthElections = elections.filter((election: any) => {
            const start = new Date(election.voting_start);
            const end = new Date(election.voting_end);
            return (
                (start.getMonth() === currentMonth - 1 &&
                    start.getFullYear() === currentYear) ||
                (end.getMonth() === currentMonth - 1 &&
                    end.getFullYear() === currentYear)
            );
        });

        const grouped: Record<number, any[]> = {};
        monthElections.forEach((election: any) => {
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
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

// ===== CREATE ELECTION DIALOG COMPONENT =====
interface CreateElectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const CreateElectionDialog: React.FC<CreateElectionDialogProps> = ({
    open,
    onOpenChange,
    onSuccess,
}) => {
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<ElectionType | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<
        (typeof COURSES)[0] | null
    >(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        voting_start: "",
        voting_end: "",
    });
    const [toast, setToast] = useState<{
        type: "success" | "error";
        title: string;
        message: string;
    } | null>(null);

    const showToast = (
        type: "success" | "error",
        title: string,
        message: string,
    ) => {
        setToast({ type, title, message });
        setTimeout(() => setToast(null), 5000);
    };

    const handleTypeSelect = (type: ElectionType) => {
        setSelectedType(type);
        setFormData({
            ...formData,
            title: `${type.id} Election ${new Date().getFullYear()}`,
        });
        setStep(type.id === "SBO" ? 2 : 3);
    };

    const handleCourseSelect = (course: (typeof COURSES)[0]) => {
        setSelectedCourse(course);
        setFormData({
            ...formData,
            title: `${course.code} SBO Election ${new Date().getFullYear()}`,
        });
        setStep(3);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const submitData = {
                title: formData.title,
                election_type: selectedType!.id,
                description: formData.description,
                voting_start: formData.voting_start,
                voting_end: formData.voting_end,
                ...(selectedType!.id === "SBO" && selectedCourse
                    ? { course_id: selectedCourse.id }
                    : {}),
            };

            await adminAPI.createElection(submitData);
            showToast(
                "success",
                "Election Created",
                `"${formData.title}" has been created!`,
            );
            onSuccess();
            setTimeout(() => {
                onOpenChange(false);
                resetForm();
            }, 2000);
        } catch (err: any) {
            showToast(
                "error",
                "Creation Failed",
                err.response?.data?.message || "Failed to create election",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setSelectedType(null);
        setSelectedCourse(null);
        setFormData({
            title: "",
            description: "",
            voting_start: "",
            voting_end: "",
        });
        setToast(null);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(val) => {
                if (!val) resetForm();
                onOpenChange(val);
            }}
        >
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {step === 1 && "Select Election Type"}
                        {step === 2 && "Select Course for SBO Election"}
                        {step === 3 && "Configure Election Details"}
                    </DialogTitle>
                </DialogHeader>

                {toast && (
                    <div
                        className={`p-3 rounded-lg border ${
                            toast.type === "success"
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-red-50 border-red-200 text-red-800"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {toast.type === "success" ? (
                                <CheckCircle className="w-4 h-4" />
                            ) : (
                                <AlertCircle className="w-4 h-4" />
                            )}
                            <div>
                                <p className="font-bold">{toast.title}</p>
                                <p className="text-sm">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => setToast(null)}
                                className="ml-auto text-gray-500 hover:text-gray-700"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 px-2 py-2">
                    <div
                        className={`flex-1 h-1.5 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-gray-200"}`}
                    />
                    <div
                        className={`flex-1 h-1.5 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`}
                    />
                    <div
                        className={`flex-1 h-1.5 rounded-full ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`}
                    />
                </div>

                {step === 1 && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-gray-500">
                            Choose the type of election you want to create
                        </p>
                        <div className="space-y-3">
                            {Object.entries(ELECTION_TYPES).map(
                                ([key, type]) => {
                                    const Icon = type.icon;
                                    return (
                                        <div
                                            key={key}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                selectedType?.id === type.id
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-blue-300"
                                            }`}
                                            onClick={() =>
                                                handleTypeSelect(type)
                                            }
                                        >
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center flex-shrink-0`}
                                                >
                                                    <Icon className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-base">
                                                        {type.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">
                                                        {type.id} Election
                                                    </p>
                                                    <div className="flex items-center text-xs text-gray-400 mt-1">
                                                        <Users className="w-3 h-3 mr-1" />
                                                        <span>
                                                            Multiple positions
                                                            available
                                                        </span>
                                                    </div>
                                                </div>
                                                {selectedType?.id ===
                                                    type.id && (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && selectedType?.id === "SBO" && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-gray-500">
                            Select which course this SBO election is for
                        </p>
                        <div className="space-y-2">
                            {COURSES.map((course) => (
                                <div
                                    key={course.id}
                                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                        selectedCourse?.id === course.id
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 hover:border-green-300"
                                    }`}
                                    onClick={() => handleCourseSelect(course)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-base">
                                                {course.code}
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                {course.name}
                                            </p>
                                        </div>
                                        {selectedCourse?.id === course.id && (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setStep(1)}
                            className="w-full"
                        >
                            Back to Election Types
                        </Button>
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div
                            className={`p-3 rounded-lg ${selectedType?.bgColor}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Election Type
                                    </p>
                                    <p className="font-bold text-lg">
                                        {selectedType?.name}
                                    </p>
                                    {selectedCourse && (
                                        <p className="text-sm text-gray-500">
                                            Course: {selectedCourse.code}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">
                                        Positions
                                    </p>
                                    <p className="font-bold text-2xl text-blue-600">
                                        0
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Election Title *
                            </Label>
                            <Input
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        title: e.target.value,
                                    })
                                }
                                placeholder="Enter election title"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Description
                            </Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Describe the election purpose..."
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">
                                    Voting Start *
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={formatDateTimeForInput(
                                        formData.voting_start,
                                    )}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            voting_start: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">
                                    Voting End *
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={formatDateTimeForInput(
                                        formData.voting_end,
                                    )}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            voting_end: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setStep(selectedType?.id === "SBO" ? 2 : 1)
                                }
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    "Create Election"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

// ===== MAIN DASHBOARD COMPONENT =====
const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        data: elections = [],
        isLoading,
        refetch,
        isFetching,
    } = useElections();
    const refreshElections = useRefreshElections();
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const [turnoutByYear, setTurnoutByYear] = useState<
        Array<{
            year: string;
            percentage: number;
            voted: number;
            total: number;
        }>
    >([]);
    const [loadingTurnout, setLoadingTurnout] = useState(false);

    const [stats, setStats] = useState<DashboardStats>({
        totalElections: 0,
        activeElections: 0,
        totalVoters: 0,
        turnoutPercentage: 0,
    });

    useEffect(() => {
        const fetchTurnoutData = async () => {
            if (!elections.length) return;

            setLoadingTurnout(true);
            try {
                const activeElection =
                    elections.find((e: any) => {
                        const now = new Date();
                        const start = new Date(e.voting_start);
                        const end = new Date(e.voting_end);
                        return now >= start && now <= end;
                    }) || elections[0];

                if (activeElection) {
                    const response = await monitoringAPI.getTurnout(
                        activeElection.election_id,
                    );
                    const data = response.data;

                    if (data?.breakdown?.by_year) {
                        const byYear = data.breakdown.by_year.map(
                            (item: any) => ({
                                year: `Year ${item.year_level}`,
                                percentage:
                                    item.percentage ||
                                    (item.total > 0
                                        ? Math.round(
                                              (item.voted / item.total) * 100,
                                          )
                                        : 0),
                                voted: item.voted || 0,
                                total: item.total || 0,
                            }),
                        );
                        setTurnoutByYear(byYear);
                    } else {
                        setTurnoutByYear([
                            {
                                year: "1st Year",
                                percentage: 0,
                                voted: 0,
                                total: 0,
                            },
                            {
                                year: "2nd Year",
                                percentage: 0,
                                voted: 0,
                                total: 0,
                            },
                            {
                                year: "3rd Year",
                                percentage: 0,
                                voted: 0,
                                total: 0,
                            },
                            {
                                year: "4th Year",
                                percentage: 0,
                                voted: 0,
                                total: 0,
                            },
                        ]);
                    }

                    if (data) {
                        setStats((prev) => ({
                            ...prev,
                            totalVoters: data.total_voters || 0,
                            turnoutPercentage: data.turnout_percentage || 0,
                        }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch turnout data:", error);
                setTurnoutByYear([
                    { year: "1st Year", percentage: 25, voted: 25, total: 100 },
                    { year: "2nd Year", percentage: 75, voted: 75, total: 100 },
                    { year: "3rd Year", percentage: 50, voted: 50, total: 100 },
                    { year: "4th Year", percentage: 25, voted: 25, total: 100 },
                ]);
            } finally {
                setLoadingTurnout(false);
            }
        };

        fetchTurnoutData();
    }, [elections]);

    useEffect(() => {
        if (elections.length > 0) {
            const now = new Date();
            const active = elections.filter((e: any) => {
                const start = new Date(e.voting_start);
                const end = new Date(e.voting_end);
                return now >= start && now <= end;
            });
            setStats((prev) => ({
                ...prev,
                totalElections: elections.length,
                activeElections: active.length,
            }));
        }
    }, [elections]);

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

    const handleCreateSuccess = () => {
        refreshElections();
        refetch();
    };

    const quickActions = [
        {
            icon: Plus,
            label: "Create Election",
            sub: "Start a new Election",
            action: () => setIsCreateDialogOpen(true),
            color: "blue",
        },
        {
            icon: Upload,
            label: "Import Voters",
            sub: "Bulk Upload Voters",
            path: "/admin/import-voters",
            color: "teal",
        },
        {
            icon: UserPlus,
            label: "Manage Users",
            sub: "Manage System Users",
            path: "/admin/users/list",
            color: "purple",
        },
        {
            icon: BarChart3,
            label: "View Reports",
            sub: "Analytics & Reports",
            path: "/admin/reports",
            color: "orange",
        },
    ];

    const recentElections = elections.slice(0, 5).map((election: any) => ({
        title: election.title,
        sub: election.description || "No description",
        status:
            new Date(election.voting_end) < new Date()
                ? "Ended"
                : new Date(election.voting_start) > new Date()
                  ? "Upcoming"
                  : "Ongoing",
        start: new Date(election.voting_start).toLocaleDateString(),
        end: new Date(election.voting_end).toLocaleDateString(),
    }));

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Create Election Dialog */}
            <CreateElectionDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSuccess={handleCreateSuccess}
            />

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500">
                            Total Elections
                        </p>
                        <p className="text-xl font-extrabold text-gray-900">
                            {stats.totalElections}
                        </p>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500">
                            Active Election
                        </p>
                        <p className="text-xl font-extrabold text-gray-900">
                            {stats.activeElections}
                        </p>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500">
                            Registered Voters
                        </p>
                        <p className="text-xl font-extrabold text-gray-900">
                            {stats.totalVoters.toLocaleString()}
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
                            {stats.turnoutPercentage}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1.05fr] gap-4">
                {/* Voter Turnout by Year Level */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                    <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Voter Turnout by Year Level
                        {loadingTurnout && (
                            <Loader2 className="w-3 h-3 animate-spin text-gray-400 ml-2" />
                        )}
                    </h3>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={turnoutByYear}>
                                <CartesianGrid
                                    stroke="#f1f5f9"
                                    strokeDasharray="3 3"
                                />
                                <XAxis
                                    dataKey="year"
                                    tick={{ fontSize: 11 }}
                                    stroke="#94a3b8"
                                />
                                <YAxis
                                    tick={{ fontSize: 11 }}
                                    stroke="#94a3b8"
                                    domain={[0, 100]}
                                    tickFormatter={(v) => `${v}%`}
                                />
                                <Tooltip
                                    formatter={(value: number) => [
                                        `${value}%`,
                                        "Turnout",
                                    ]}
                                    labelFormatter={(label) => `${label}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="percentage"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    fill="rgba(37,99,235,0.08)"
                                    dot={{ r: 4, fill: "#2563eb" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {turnoutByYear.length > 0 && (
                        <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                            {turnoutByYear.map((item) => (
                                <div key={item.year} className="text-center">
                                    <span className="font-medium text-gray-700">
                                        {item.year}
                                    </span>
                                    <span className="block text-blue-600 font-bold">
                                        {item.percentage}%
                                    </span>
                                    <span className="text-gray-400 text-[10px]">
                                        {item.voted}/{item.total}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                    <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 mb-4">
                        ⚡ Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {quickActions.map((action, idx) => (
                            <div
                                key={idx}
                                className="border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                                onClick={() => {
                                    if (action.action) {
                                        action.action();
                                    } else if (action.path) {
                                        navigate(action.path);
                                    }
                                }}
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center mb-2">
                                    <action.icon className="w-4 h-4" />
                                </div>
                                <p className="text-sm font-bold text-gray-900">
                                    {action.label}
                                </p>
                                <p className="text-xs font-medium text-gray-400">
                                    {action.sub}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div
                        className="border border-gray-200 rounded-xl p-3 mt-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                        onClick={() => navigate("/admin/monitoring/audit")}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">
                                    Audit logs
                                </p>
                                <p className="text-xs font-medium text-gray-400">
                                    System Activity
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Calendar */}
                <EnhancedCalendar
                    elections={elections}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    onMonthChange={handleMonthChange}
                />
            </div>

            {/* Recent Elections - List View */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                        📅 Recent Elections
                    </h3>
                    <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 text-xs"
                    >
                        {recentElections.length} elections
                    </Badge>
                </div>
                {recentElections.length === 0 ? (
                    <div className="px-5 py-8 text-center text-gray-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No elections created yet</p>
                        <Button
                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Create Your First
                            Election
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {recentElections.map((election, idx) => (
                            <div
                                key={idx}
                                className="px-5 py-3.5 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-extrabold text-blue-600">
                                        {election.title}
                                    </span>
                                    <span
                                        className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${
                                            election.status === "Ongoing"
                                                ? "bg-green-100 text-green-700"
                                                : election.status === "Upcoming"
                                                  ? "bg-yellow-100 text-yellow-700"
                                                  : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {election.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {election.sub}
                                </p>
                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                    <span>
                                        📅 {election.start} → {election.end}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;