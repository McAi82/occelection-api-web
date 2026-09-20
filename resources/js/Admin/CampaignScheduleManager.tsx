// resources/js/pages/Admin/CampaignScheduleManager.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { useElections } from "../hooks/useElections";
import { useCandidates } from "../hooks/useCandidates";
import { RefreshButton } from "../components/common/RefreshButton";
import { courseAPI } from "../api/courses";
import {
    campaignScheduleAPI,
    CampaignSchedule,
} from "../api/campaignschedules";
import {
    Calendar as CalendarIcon,
    Clock,
    Plus,
    Edit,
    Trash2,
    Loader2,
    CheckCircle,
    AlertCircle,
    School,
    LayoutGrid,
    List,
    ChevronLeft,
    ChevronRight,
    Users,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
}

interface Candidate {
    candidate_id: number;
    user_id: number;
    is_approved: boolean;
    position?: {
        title: string;
    };
    user?: {
        first_name: string;
        last_name: string;
    };
}

interface CourseSection {
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
}

type ViewMode = "grid" | "list";

interface FormData {
    section_id: string;
    start_time: string;
    end_time: string;
    candidate_id: string;
    notes: string;
}

interface CreateScheduleData {
    section_id: number;
    start_time: string;
    end_time: string;
    candidate_id: string | null;
    notes: string;
}

const CampaignScheduleManager: React.FC = () => {
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(20);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [activeTab, setActiveTab] = useState("schedules");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] =
        useState<CampaignSchedule | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [sections, setSections] = useState<CourseSection[]>([]);
    const [filteredSections, setFilteredSections] = useState<CourseSection[]>(
        [],
    );
    const [selectedCourseFilter, setSelectedCourseFilter] =
        useState<string>("all");
    const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");
    const [schedules, setSchedules] = useState<CampaignSchedule[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        section_id: "",
        start_time: "",
        end_time: "",
        candidate_id: "",
        notes: "",
    });

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

    // Fetch elections
    const { data: elections = [], isLoading: electionsLoading } =
        useElections();

    // Fetch candidates for the selected election
    const { data: candidates = [] } = useCandidates(selectedElection);

    // Set default election when data loads
    useEffect(() => {
        if (elections.length > 0 && !selectedElection) {
            setSelectedElection(elections[0].election_id.toString());
        }
    }, [elections]);

    // Fetch sections
    useEffect(() => {
        fetchSections();
    }, []);

    // Filter sections
    useEffect(() => {
        filterSections();
    }, [selectedCourseFilter, selectedYearFilter, sections]);

    // Fetch schedules when election changes or page changes
    useEffect(() => {
        if (selectedElection) {
            fetchSchedules();
        }
    }, [selectedElection, currentPage]);

    const fetchSections = async (): Promise<void> => {
        try {
            const response = await courseAPI.getAllSections();
            const sectionsData = response.data || [];
            setSections(sectionsData);
            setFilteredSections(sectionsData);
        } catch (error) {
            console.error("Failed to fetch sections:", error);
        }
    };

    const filterSections = (): void => {
        let filtered = [...sections];
        if (selectedCourseFilter !== "all") {
            filtered = filtered.filter(
                (s) => s.course?.course_code === selectedCourseFilter,
            );
        }
        if (selectedYearFilter !== "all") {
            filtered = filtered.filter(
                (s) => s.year_level === parseInt(selectedYearFilter),
            );
        }
        setFilteredSections(filtered);
    };

    const fetchSchedules = async (): Promise<void> => {
        if (!selectedElection) return;
        setLoading(true);
        setRefreshing(true);
        try {
            console.log("Fetching schedules for election:", selectedElection);
            const response = await campaignScheduleAPI.getByElection(
                selectedElection,
                currentPage,
                perPage,
            );

            console.log("Raw API Response:", response);

            // ✅ Safely extract data
            const responseData = response.data;
            let schedulesData: CampaignSchedule[] = [];
            let paginationData = {
                current_page: 1,
                last_page: 1,
                per_page: perPage,
                total: 0,
            };

            if (responseData) {
                // ✅ Case 1: responseData.data is the array (from ApiResponse wrapper)
                if (responseData.data && Array.isArray(responseData.data)) {
                    schedulesData = responseData.data;
                    if (responseData.current_page !== undefined) {
                        paginationData = {
                            current_page: responseData.current_page || 1,
                            last_page: responseData.last_page || 1,
                            per_page: responseData.per_page || perPage,
                            total: responseData.total || 0,
                        };
                    } else {
                        paginationData = {
                            current_page: 1,
                            last_page: 1,
                            per_page: perPage,
                            total: responseData.data.length,
                        };
                    }
                }
                // ✅ Case 2: responseData itself is the paginated object
                else if (
                    responseData.data &&
                    responseData.data.data &&
                    Array.isArray(responseData.data.data)
                ) {
                    schedulesData = responseData.data.data;
                    paginationData = {
                        current_page: responseData.data.current_page || 1,
                        last_page: responseData.data.last_page || 1,
                        per_page: responseData.data.per_page || perPage,
                        total: responseData.data.total || 0,
                    };
                }
                // ✅ Case 3: responseData is an array directly
                else if (Array.isArray(responseData)) {
                    schedulesData = responseData;
                    paginationData = {
                        current_page: 1,
                        last_page: 1,
                        per_page: perPage,
                        total: responseData.length,
                    };
                }
                // ✅ Case 4: responseData has data property that is paginated
                else if (
                    responseData.data &&
                    responseData.data.current_page !== undefined
                ) {
                    schedulesData = responseData.data.data || [];
                    paginationData = {
                        current_page: responseData.data.current_page || 1,
                        last_page: responseData.data.last_page || 1,
                        per_page: responseData.data.per_page || perPage,
                        total: responseData.data.total || 0,
                    };
                }
            }

            console.log("Extracted schedules:", schedulesData);
            console.log("Pagination:", paginationData);

            setSchedules(schedulesData);
            setPagination(paginationData);
        } catch (error: any) {
            console.error("Failed to fetch schedules:", error);
            setError(
                error.response?.data?.message || "Failed to load schedules",
            );
            setSchedules([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async (): Promise<void> => {
        await fetchSchedules();
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!formData.section_id) {
            setError("Please select a course section");
            return;
        }
        if (!formData.start_time) {
            setError("Please select start time");
            return;
        }
        if (!formData.end_time) {
            setError("Please select end time");
            return;
        }

        const startDate = new Date(formData.start_time);
        const endDate = new Date(formData.end_time);
        const now = new Date();

        if (startDate < now) {
            setError("Start time cannot be in the past");
            return;
        }
        if (endDate <= startDate) {
            setError("End time must be after start time");
            return;
        }

        const scheduleData: CreateScheduleData = {
            section_id: parseInt(formData.section_id),
            start_time: formData.start_time,
            end_time: formData.end_time,
            candidate_id: formData.candidate_id || null,
            notes: formData.notes || "",
        };

        try {
            if (editingSchedule) {
                await campaignScheduleAPI.update(
                    editingSchedule.schedule_id,
                    scheduleData as any,
                );
                setSuccess("Schedule updated successfully");
            } else {
                await campaignScheduleAPI.create(
                    selectedElection,
                    scheduleData,
                );
                setSuccess("Schedule created successfully");
            }

            setTimeout(() => setSuccess(""), 3000);
            setIsDialogOpen(false);
            resetForm();
            await fetchSchedules();
        } catch (error: any) {
            console.error("Failed to save schedule:", error);
            setError(
                error.response?.data?.message || "Failed to save schedule",
            );
        }
    };

    const handleDelete = async (id: number): Promise<void> => {
        if (window.confirm("Are you sure you want to delete this schedule?")) {
            try {
                await campaignScheduleAPI.delete(id);
                setSuccess("Schedule deleted successfully");
                setTimeout(() => setSuccess(""), 3000);
                await fetchSchedules();
            } catch (error: any) {
                console.error("Failed to delete schedule:", error);
                setError(
                    error.response?.data?.message ||
                        "Failed to delete schedule",
                );
            }
        }
    };

    const resetForm = (): void => {
        setFormData({
            section_id: "",
            start_time: "",
            end_time: "",
            candidate_id: "",
            notes: "",
        });
        setEditingSchedule(null);
        setError("");
    };

    const openEditDialog = (schedule: CampaignSchedule): void => {
        setEditingSchedule(schedule);
        setFormData({
            section_id: schedule.section_id.toString(),
            start_time: schedule.start_time.slice(0, 16),
            end_time: schedule.end_time.slice(0, 16),
            candidate_id: schedule.candidate_id?.toString() || "",
            notes: schedule.notes || "",
        });
        setIsDialogOpen(true);
    };

    const getStatusBadge = (status: string): React.ReactNode => {
        const statusConfig: Record<string, { label: string; color: string }> = {
            pending: {
                label: "Pending",
                color: "bg-yellow-100 text-yellow-800",
            },
            ongoing: { label: "Ongoing", color: "bg-blue-100 text-blue-800" },
            completed: {
                label: "Completed",
                color: "bg-green-100 text-green-800",
            },
            cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return <Badge className={config.color}>{config.label}</Badge>;
    };

    const getCandidateName = (candidateId: number | null): string => {
        if (!candidateId) return "Unassigned";
        const candidate = candidates.find(
            (c: Candidate) => c.candidate_id === candidateId,
        );
        if (!candidate) return "Unassigned";
        return (
            `${candidate.user?.first_name || ""} ${candidate.user?.last_name || ""}`.trim() ||
            "Unassigned"
        );
    };

    const uniqueCourses = [
        ...new Set(sections.map((s) => s.course?.course_code).filter(Boolean)),
    ];
    const yearLevels = [1, 2, 3, 4];

    const isLoading = electionsLoading || loading;

    console.log("Current schedules state:", schedules);
    console.log("Current pagination state:", pagination);

    if (isLoading && !schedules.length) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Campaign Schedule Manager
                    </h1>
                    <p className="text-gray-600">
                        Schedule campaign periods for different course sections
                    </p>
                </div>
                <div className="flex space-x-2">
                    <RefreshButton
                        onClick={handleRefresh}
                        isLoading={refreshing}
                    />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Schedule
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingSchedule
                                        ? "Edit Schedule"
                                        : "Create Campaign Schedule"}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 text-sm flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        {success}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Course Section *</Label>
                                    <Select
                                        value={formData.section_id}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                section_id: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Course Section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredSections.map((section) => (
                                                <SelectItem
                                                    key={section.section_id}
                                                    value={section.section_id.toString()}
                                                >
                                                    {
                                                        section.course
                                                            ?.course_code
                                                    }{" "}
                                                    - Year {section.year_level}{" "}
                                                    Section{" "}
                                                    {section.section_code}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Date & Time *</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formatDateTimeForInput(
                                                formData.start_time,
                                            )}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    start_time: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date & Time *</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.end_time}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    end_time: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Assign Candidate (Optional)</Label>
                                    <Select
                                        value={formData.candidate_id || "none"}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                candidate_id:
                                                    value === "none"
                                                        ? ""
                                                        : value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Candidate" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                None
                                            </SelectItem>
                                            {candidates
                                                .filter(
                                                    (c: Candidate) =>
                                                        c.is_approved,
                                                )
                                                .map((candidate: Candidate) => (
                                                    <SelectItem
                                                        key={
                                                            candidate.candidate_id
                                                        }
                                                        value={candidate.candidate_id.toString()}
                                                    >
                                                        {candidate.user
                                                            ?.first_name ||
                                                            ""}{" "}
                                                        {candidate.user
                                                            ?.last_name ||
                                                            ""}{" "}
                                                        -{" "}
                                                        {candidate.position
                                                            ?.title ||
                                                            "Unknown"}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        placeholder="Additional instructions or notes"
                                        value={formData.notes}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                notes: e.target.value,
                                            })
                                        }
                                        rows={2}
                                    />
                                </div>

                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : editingSchedule ? (
                                            "Update"
                                        ) : (
                                            "Create"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Election Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Election</CardTitle>
                </CardHeader>
                <CardContent>
                    <select
                        className="w-full md:w-64 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedElection}
                        onChange={(e) => {
                            setSelectedElection(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">Select an election</option>
                        {elections.map((election: Election) => (
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

            {/* Section Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <School className="w-5 h-5 text-blue-600" />
                        Filter Course Sections
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Filter by Course</Label>
                            <select
                                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedCourseFilter}
                                onChange={(e) =>
                                    setSelectedCourseFilter(e.target.value)
                                }
                            >
                                <option value="all">All Courses</option>
                                {uniqueCourses.map((course) => (
                                    <option key={course} value={course}>
                                        {course}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Filter by Year Level</Label>
                            <select
                                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedYearFilter}
                                onChange={(e) =>
                                    setSelectedYearFilter(e.target.value)
                                }
                            >
                                <option value="all">All Years</option>
                                {yearLevels.map((year) => (
                                    <option key={year} value={year}>
                                        Year {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* View Toggle */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Schedules
                    </h2>
                    <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700"
                    >
                        {pagination.total} total
                    </Badge>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                    <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={`rounded-lg px-4 transition-all duration-200 ${
                            viewMode === "grid"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Grid
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className={`rounded-lg px-4 transition-all duration-200 ${
                            viewMode === "list"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <List className="w-4 h-4 mr-2" />
                        List
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="schedules">
                        By Course Section
                    </TabsTrigger>
                    <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                </TabsList>

                <TabsContent value="schedules" className="space-y-4">
                    {filteredSections.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <School className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-500">
                                    No course sections found
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Try changing your filters
                                </p>
                            </CardContent>
                        </Card>
                    ) : viewMode === "grid" ? (
                        // GRID VIEW
                        filteredSections.map((section) => {
                            const sectionSchedules = schedules.filter(
                                (s: CampaignSchedule) =>
                                    s.section_id === section.section_id,
                            );
                            return (
                                <Card key={section.section_id}>
                                    <CardHeader className="bg-gray-50">
                                        <CardTitle className="flex items-center justify-between">
                                            <span className="flex items-center">
                                                <School className="w-5 h-5 mr-2 text-blue-600" />
                                                {section.course?.course_code} -
                                                Year {section.year_level}{" "}
                                                Section {section.section_code}
                                            </span>
                                            <Badge variant="outline">
                                                {sectionSchedules.length}{" "}
                                                schedules
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {sectionSchedules.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                No schedules for this section
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {sectionSchedules.map(
                                                    (
                                                        schedule: CampaignSchedule,
                                                    ) => (
                                                        <div
                                                            key={
                                                                schedule.schedule_id
                                                            }
                                                            className="p-4 hover:bg-gray-50"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-3 mb-2">
                                                                        {getStatusBadge(
                                                                            schedule.status,
                                                                        )}
                                                                        <span className="text-sm text-gray-500">
                                                                            Candidate:{" "}
                                                                            {getCandidateName(
                                                                                schedule.candidate_id,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                                        <div className="flex items-center text-gray-600">
                                                                            <CalendarIcon className="w-4 h-4 mr-2" />
                                                                            {new Date(
                                                                                schedule.start_time,
                                                                            ).toLocaleDateString()}
                                                                        </div>
                                                                        <div className="flex items-center text-gray-600">
                                                                            <Clock className="w-4 h-4 mr-2" />
                                                                            {new Date(
                                                                                schedule.start_time,
                                                                            ).toLocaleTimeString()}{" "}
                                                                            -{" "}
                                                                            {new Date(
                                                                                schedule.end_time,
                                                                            ).toLocaleTimeString()}
                                                                        </div>
                                                                        {schedule.notes && (
                                                                            <div className="flex items-start text-gray-600 col-span-2">
                                                                                <span className="font-medium mr-2">
                                                                                    Notes:
                                                                                </span>
                                                                                {
                                                                                    schedule.notes
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex space-x-2 ml-4">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            openEditDialog(
                                                                                schedule,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                schedule.schedule_id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        // LIST VIEW
                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Course Section
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Date
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Time
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Candidate
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                                    Status
                                                </th>
                                                <th className="text-right p-4 text-sm font-semibold text-gray-700">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {schedules.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="p-8 text-center text-gray-500"
                                                    >
                                                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                        <p>
                                                            No schedules found
                                                            for this election
                                                        </p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                schedules.map(
                                                    (
                                                        schedule: CampaignSchedule,
                                                    ) => {
                                                        const section =
                                                            filteredSections.find(
                                                                (s) =>
                                                                    s.section_id ===
                                                                    schedule.section_id,
                                                            );
                                                        return (
                                                            <tr
                                                                key={
                                                                    schedule.schedule_id
                                                                }
                                                                className="hover:bg-blue-50/50 transition-colors"
                                                            >
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <School className="w-4 h-4 text-blue-500" />
                                                                        <span className="font-medium">
                                                                            {section
                                                                                ?.course
                                                                                ?.course_code ||
                                                                                "N/A"}{" "}
                                                                            -
                                                                            Year{" "}
                                                                            {section?.year_level ||
                                                                                "N/A"}{" "}
                                                                            Section{" "}
                                                                            {section?.section_code ||
                                                                                "N/A"}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                                                                        {new Date(
                                                                            schedule.start_time,
                                                                        ).toLocaleDateString()}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                                        {new Date(
                                                                            schedule.start_time,
                                                                        ).toLocaleTimeString()}{" "}
                                                                        -{" "}
                                                                        {new Date(
                                                                            schedule.end_time,
                                                                        ).toLocaleTimeString()}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                        <Users className="w-4 h-4 text-gray-400" />
                                                                        {getCandidateName(
                                                                            schedule.candidate_id,
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    {getStatusBadge(
                                                                        schedule.status,
                                                                    )}
                                                                </td>
                                                                <td className="p-4 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                            onClick={() =>
                                                                                openEditDialog(
                                                                                    schedule,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Edit className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                            onClick={() =>
                                                                                handleDelete(
                                                                                    schedule.schedule_id,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pagination */}
                    {pagination.total > perPage && (
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center flex-wrap gap-4">
                                    <div className="text-sm text-gray-500">
                                        Showing{" "}
                                        {(pagination.current_page - 1) *
                                            perPage +
                                            1}{" "}
                                        to{" "}
                                        {Math.min(
                                            pagination.current_page * perPage,
                                            pagination.total,
                                        )}{" "}
                                        of {pagination.total} schedules
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
                                        </Button>
                                        <div className="flex items-center px-3 py-1 bg-gray-100 rounded-lg text-sm">
                                            Page {pagination.current_page} of{" "}
                                            {pagination.last_page}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.min(
                                                        pagination.last_page,
                                                        p + 1,
                                                    ),
                                                )
                                            }
                                            disabled={
                                                currentPage ===
                                                pagination.last_page
                                            }
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="timeline">
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center py-12 text-gray-500">
                                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Timeline view coming soon</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Info Box */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <CalendarIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800">
                                About Campaign Scheduling
                            </h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Campaign schedules help prevent classroom
                                disruptions by assigning specific time slots for
                                candidates to campaign in different course
                                sections. Each section will have a designated
                                campaign period where candidates can present
                                their platforms.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CampaignScheduleManager;
