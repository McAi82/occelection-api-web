// resources/js/pages/Admin/ManageElections.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import { useElections, useRefreshElections } from "../hooks/useElections";
import { RefreshButton } from "../components/common/RefreshButton";
import { adminAPI } from "../api/admin";
import {
    Plus,
    Trash2,
    Calendar,
    Clock,
    Building2,
    Users,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
    Filter,
    LayoutGrid,
    List,
    ChevronRight,
} from "lucide-react";
import type { Election as ApiElection } from "../types";

type ViewMode = "list" | "grid";
type FilterType = "all" | "CSG" | "SBO";

interface ElectionType {
    id: string;
    name: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    avatarColor: string;
}

interface FormData {
    title: string;
    description: string;
    voting_start: string;
    voting_end: string;
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
    { id: 1, code: "BSIT", name: "Bachelor of Science in Information Technology" },
    { id: 2, code: "BSBA", name: "Bachelor of Science in Business Administration" },
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

const ManageElections: React.FC = () => {
    const navigate = useNavigate();
    const { data: elections = [], isLoading, refetch, isFetching } = useElections();
    const refreshElections = useRefreshElections();

    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<ElectionType | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<typeof COURSES[0] | null>(null);
    const [formData, setFormData] = useState<FormData>({
        title: "",
        description: "",
        voting_start: "",
        voting_end: "",
    });
    const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

    const showToast = (type: "success" | "error", title: string, message: string) => {
        setToast({ type, title, message });
        setTimeout(() => setToast(null), 5000);
    };

    const handleDelete = async (id: number, title: string) => {
        if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
            setIsDeleting(id);
            try {
                await adminAPI.deleteElection(id);
                showToast("success", "Election Deleted", `"${title}" has been deleted.`);
                refreshElections();
            } catch (error: any) {
                showToast("error", "Delete Failed", error.response?.data?.message || "Failed to delete election");
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const handleTypeSelect = (type: ElectionType) => {
        setSelectedType(type);
        setFormData({ ...formData, title: `${type.id} Election ${new Date().getFullYear()}` });
        setStep(type.id === "SBO" ? 2 : 3);
    };

    const handleCourseSelect = (course: typeof COURSES[0]) => {
        setSelectedCourse(course);
        setFormData({ ...formData, title: `${course.code} SBO Election ${new Date().getFullYear()}` });
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
                ...(selectedType!.id === "SBO" && selectedCourse ? { course_id: selectedCourse.id } : {}),
            };

            await adminAPI.createElection(submitData);
            showToast("success", "Election Created", `"${formData.title}" has been created!`);
            refreshElections();
            setIsDialogOpen(false);
            resetForm();
        } catch (err: any) {
            showToast("error", "Creation Failed", err.response?.data?.message || "Failed to create election");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setSelectedType(null);
        setSelectedCourse(null);
        setFormData({ title: "", description: "", voting_start: "", voting_end: "" });
    };

    const getStatus = (election: ApiElection): { label: string; color: string; icon: React.ElementType } => {
        const now = new Date();
        const start = new Date(election.voting_start);
        const end = new Date(election.voting_end);
        if (now < start) return { label: "Upcoming", color: "bg-yellow-100 text-yellow-800", icon: Clock };
        if (now > end) return { label: "Ended", color: "bg-gray-100 text-gray-800", icon: CheckCircle };
        return { label: "Ongoing", color: "bg-green-100 text-green-800", icon: AlertCircle };
    };

    const getAvatarColor = (type: string): string => {
        const map: Record<string, string> = { CSG: "blue", SBO: "green" };
        return map[type] || "blue";
    };

    const filteredElections = elections.filter((e: ApiElection) =>
        activeFilter === "all" ? true : e.election_type === activeFilter
    );

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Elections</h1>
                    <p className="text-sm text-gray-500">Manage and oversee all elections</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold px-3 py-1">
                        🧾 {filteredElections.length} Total
                    </Badge>
                    <RefreshButton onClick={() => refetch()} isLoading={isFetching} />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-4 h-4 mr-2" /> Create Election
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl">
                                    {step === 1 && "Select Election Type"}
                                    {step === 2 && "Select Course for SBO Election"}
                                    {step === 3 && "Configure Election Details"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="flex items-center gap-2 px-2 py-2">
                                <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-gray-200"}`} />
                                <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
                                <div className={`flex-1 h-1.5 rounded-full ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`} />
                            </div>

                            {step === 1 && (
                                <div className="space-y-4 py-2">
                                    <p className="text-sm text-gray-500">Choose the type of election you want to create</p>
                                    <div className="space-y-3">
                                        {Object.entries(ELECTION_TYPES).map(([key, type]) => {
                                            const Icon = type.icon;
                                            return (
                                                <div
                                                    key={key}
                                                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                        selectedType?.id === type.id
                                                            ? "border-blue-500 bg-blue-50"
                                                            : "border-gray-200 hover:border-blue-300"
                                                    }`}
                                                    onClick={() => handleTypeSelect(type)}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center flex-shrink-0`}>
                                                            <Icon className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-base">{type.name}</h4>
                                                            <p className="text-sm text-gray-500">{type.id} Election</p>
                                                            <div className="flex items-center text-xs text-gray-400 mt-1">
                                                                <Users className="w-3 h-3 mr-1" />
                                                                <span>Multiple positions available</span>
                                                            </div>
                                                        </div>
                                                        {selectedType?.id === type.id && (
                                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {step === 2 && selectedType?.id === "SBO" && (
                                <div className="space-y-4 py-2">
                                    <p className="text-sm text-gray-500">Select which course this SBO election is for</p>
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
                                                        <h4 className="font-bold text-base">{course.code}</h4>
                                                        <p className="text-sm text-gray-500">{course.name}</p>
                                                    </div>
                                                    {selectedCourse?.id === course.id && (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                                        Back to Election Types
                                    </Button>
                                </div>
                            )}

                            {step === 3 && (
                                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                                    <div className={`p-3 rounded-lg ${selectedType?.bgColor}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">Election Type</p>
                                                <p className="font-bold text-lg">{selectedType?.name}</p>
                                                {selectedCourse && (
                                                    <p className="text-sm text-gray-500">Course: {selectedCourse.code}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Positions</p>
                                                <p className="font-bold text-2xl text-blue-600">0</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">Election Title *</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Enter election title"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">Description</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Describe the election purpose..."
                                            rows={2}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">Voting Start *</Label>
                                            <Input
                                                type="datetime-local"
                                                value={formatDateTimeForInput(formData.voting_start)}
                                                onChange={(e) => setFormData({ ...formData, voting_start: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">Voting End *</Label>
                                            <Input
                                                type="datetime-local"
                                                value={formatDateTimeForInput(formData.voting_end)}
                                                onChange={(e) => setFormData({ ...formData, voting_end: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep(selectedType?.id === "SBO" ? 2 : 1)}
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
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
                    toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                }`}>
                    <div className="flex items-center gap-2">
                        {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <div>
                            <p className="font-bold">{toast.title}</p>
                            <p className="text-sm">{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="ml-4 text-gray-500 hover:text-gray-700">
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Panel */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="font-bold text-sm text-gray-900">Filter Elections</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        {["all", "CSG", "SBO"].map((filter) => (
                            <button
                                key={filter}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                    activeFilter === filter
                                        ? "bg-blue-600 text-white"
                                        : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                                }`}
                                onClick={() => setActiveFilter(filter as FilterType)}
                            >
                                {filter === "all" ? "All" : filter}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
                        <button
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-200"
                            }`}
                            onClick={() => setViewMode("list")}
                        >
                            <List className="w-4 h-4 inline mr-1.5" />
                            List
                        </button>
                        <button
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-200"
                            }`}
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="w-4 h-4 inline mr-1.5" />
                            Grid
                        </button>
                    </div>
                </div>
            </div>

            {/* Elections Table - List View (Default) */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {viewMode === "list" ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left text-xs font-bold text-gray-500 px-5 py-3">Election</th>
                                    <th className="text-left text-xs font-bold text-gray-500 px-5 py-3">Type</th>
                                    <th className="text-left text-xs font-bold text-gray-500 px-5 py-3">Status</th>
                                    <th className="text-left text-xs font-bold text-gray-500 px-5 py-3">Date Range</th>
                                    <th className="text-left text-xs font-bold text-gray-500 px-5 py-3">Course</th>
                                    <th className="text-right text-xs font-bold text-gray-500 px-5 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredElections.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-500">
                                            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p>No elections found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredElections.map((election: ApiElection) => {
                                        const status = getStatus(election);
                                        const StatusIcon = status.icon;
                                        const avatarColor = getAvatarColor(election.election_type);

                                        return (
                                            <tr key={election.election_id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-lg bg-${avatarColor}-50 text-${avatarColor}-600 flex items-center justify-center flex-shrink-0`}>
                                                            <Users className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-extrabold text-sm text-gray-900">{election.title}</p>
                                                            <p className="text-xs text-gray-400">{election.description || "No description"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-xs font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-lg">
                                                        {election.election_type}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${status.color} px-3 py-1 rounded-full`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(election.voting_start).toLocaleDateString()} → {new Date(election.voting_end).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-sm font-bold text-gray-700">
                                                        {election.course ? (typeof election.course === "object" && "course_code" in election.course ? election.course.course_code : "N/A") : "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center justify-end gap-4">
                                                        <button
                                                            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                                                            onClick={() => navigate(`/elections/${election.election_id}`)}
                                                        >
                                                            View <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            className="text-sm font-bold text-gray-500 hover:text-gray-700"
                                                            onClick={() => navigate(`/elections/${election.election_id}/live-results`)}
                                                        >
                                                            Results
                                                        </button>
                                                        <button
                                                            className="text-sm font-bold text-red-500 hover:text-red-700"
                                                            onClick={() => handleDelete(election.election_id, election.title)}
                                                            disabled={isDeleting === election.election_id}
                                                        >
                                                            {isDeleting === election.election_id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        {status.label === "Ended" && (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                                                                🏆 Winners
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredElections.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>No elections found</p>
                            </div>
                        ) : (
                            filteredElections.map((election: ApiElection) => {
                                const status = getStatus(election);
                                const StatusIcon = status.icon;
                                const avatarColor = getAvatarColor(election.election_type);

                                return (
                                    <div key={election.election_id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg bg-${avatarColor}-50 text-${avatarColor}-600 flex items-center justify-center flex-shrink-0`}>
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-sm text-gray-900">{election.title}</p>
                                                    <p className="text-xs text-gray-400 truncate max-w-[150px]">{election.description || "No description"}</p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${status.color} px-2 py-0.5 rounded-full`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(election.voting_start).toLocaleDateString()} → {new Date(election.voting_end).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">{election.election_type}</Badge>
                                                <span className="font-bold text-gray-700">
                                                    {election.course ? (typeof election.course === "object" && "course_code" in election.course ? election.course.course_code : "N/A") : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <button
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                                    onClick={() => navigate(`/elections/${election.election_id}`)}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                                                    onClick={() => navigate(`/elections/${election.election_id}/live-results`)}
                                                >
                                                    Results
                                                </button>
                                            </div>
                                            <button
                                                className="text-xs font-bold text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(election.election_id, election.title)}
                                                disabled={isDeleting === election.election_id}
                                            >
                                                {isDeleting === election.election_id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3 h-3" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageElections;