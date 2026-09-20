// resources/js/pages/Feedback/FeedbackPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
    Star,
    ThumbsUp,
    MessageCircle,
    Award,
    Sparkles,
    Filter,
    X,
    Loader2,
    Search,
    AlertCircle,
    User,
    BarChart3,
    PieChart as PieChartIcon,
    Users,
    MessageSquare,
    Lightbulb,
    Send,
    Edit,
    Trash2,
    CheckCircle,
} from "lucide-react";
import { feedbackAPI } from "../api/feedback";
import { electionAPI } from "../api/elections";
import { useAuth } from "../contexts/AuthContext";
import type { FeedbackCategory } from "../types";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface Feedback {
    feedback_id: number;
    rating: number;
    category_id?: number;
    category_name?: string;
    title?: string;
    comment: string;
    is_public: boolean;
    is_anonymous: boolean;
    created_at: string;
    helpful_count?: number;
    admin_response?: string;
    user?: {
        user_id: number;
        first_name: string;
        last_name: string;
        email?: string;
    };
    election?: {
        election_id: number;
        title: string;
    };
}

interface Election {
    election_id: number;
    title: string;
}

interface FormData {
    election_id: string;
    category_id: string;
    rating: number;
    title: string;
    comment: string;
    is_public: boolean;
    is_anonymous: boolean;
}

const FeedbackPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [elections, setElections] = useState<Election[]>([]);
    const [categories, setCategories] = useState<FeedbackCategory[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState<FormData>({
        election_id: "",
        category_id: "",
        rating: 5,
        title: "",
        comment: "",
        is_public: true,
        is_anonymous: false,
    });
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(
        null,
    );
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [submittedAlert, setSubmittedAlert] = useState<{
        show: boolean;
        electionTitle: string;
        feedback: Feedback | null;
    }>({
        show: false,
        electionTitle: "",
        feedback: null,
    });
    const [stats, setStats] = useState<{
        total: number;
        avgRating: number;
        helpfulTotal: number;
        ratingDistribution: Array<{ rating: number; count: number }>;
    }>({
        total: 0,
        avgRating: 0,
        helpfulTotal: 0,
        ratingDistribution: [],
    });

    useEffect(() => {
        fetchElections();
        fetchCategories();
        fetchFeedback();
    }, []);

    useEffect(() => {
        filterFeedback();
    }, [feedback, activeFilter, selectedRating, searchTerm]);

    const fetchElections = async (): Promise<void> => {
        try {
            const response = await electionAPI.getAll();
            const electionsData = response.data;
            setElections(Array.isArray(electionsData) ? electionsData : []);
            if (electionsData && electionsData.length > 0) {
                setFormData((prev) => ({
                    ...prev,
                    election_id: electionsData[0].election_id.toString(),
                }));
            }
        } catch (error) {
            console.error("Failed to fetch elections:", error);
        }
    };

    const fetchCategories = async (): Promise<void> => {
        try {
            const response = await feedbackAPI.getCategories();
            const categoriesData = response.data;
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchFeedback = async (): Promise<void> => {
        setLoading(true);
        setError("");
        try {
            const response = await feedbackAPI.getAll();
            const feedbackData = response.data || [];
            setFeedback(feedbackData);
            calculateStats(feedbackData);
        } catch (error: any) {
            console.error("Failed to fetch feedback:", error);
            setError(
                error.response?.data?.message || "Failed to load feedback",
            );
            setFeedback([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: Feedback[]) => {
        const total = data.length;
        const avgRating =
            total > 0 ? data.reduce((sum, f) => sum + f.rating, 0) / total : 0;
        const helpfulTotal = data.reduce(
            (sum, f) => sum + (f.helpful_count || 0),
            0,
        );

        const distribution = [1, 2, 3, 4, 5].map((r) => ({
            rating: r,
            count: data.filter((f) => f.rating === r).length,
        }));

        setStats({
            total,
            avgRating,
            helpfulTotal,
            ratingDistribution: distribution,
        });
    };

    const filterFeedback = () => {
        let filtered = [...feedback];

        if (activeFilter !== "all") {
            if (activeFilter === "high-rating") {
                filtered = filtered.filter((f) => f.rating >= 4);
            } else if (activeFilter === "mid-rating") {
                filtered = filtered.filter((f) => f.rating === 3);
            } else if (activeFilter === "low-rating") {
                filtered = filtered.filter((f) => f.rating <= 2);
            } else if (activeFilter === "with_response") {
                filtered = filtered.filter((f) => f.admin_response);
            }
        }

        if (selectedRating) {
            filtered = filtered.filter((f) => f.rating === selectedRating);
        }

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (f) =>
                    f.comment?.toLowerCase().includes(search) ||
                    f.title?.toLowerCase().includes(search) ||
                    f.user?.first_name?.toLowerCase().includes(search) ||
                    f.user?.last_name?.toLowerCase().includes(search),
            );
        }

        setFilteredFeedback(filtered);
    };

    // ✅ Check if user already submitted feedback for selected election
    const checkFeedbackStatus = async (electionId: number) => {
        try {
            const response = await feedbackAPI.checkStatus(electionId);
            const data = response.data;

            if (data && data.has_submitted && data.feedback) {
                const feedbackData = data.feedback;
                setEditingFeedback(feedbackData);

                // Find election title
                const election = elections.find(
                    (e) => e.election_id === electionId,
                );
                setSubmittedAlert({
                    show: true,
                    electionTitle: election?.title || "this election",
                    feedback: feedbackData,
                });

                // Auto-hide after 8 seconds
                setTimeout(() => {
                    setSubmittedAlert((prev) => ({ ...prev, show: false }));
                }, 8000);

                return true;
            }
            return false;
        } catch (error) {
            console.error("Failed to check feedback status:", error);
            return false;
        }
    };

    const handleElectionChange = async (electionId: string) => {
        setFormData((prev) => ({ ...prev, election_id: electionId }));

        // ✅ Check if user already submitted feedback for this election
        if (electionId) {
            const hasSubmitted = await checkFeedbackStatus(
                parseInt(electionId),
            );
            if (hasSubmitted) {
                // Alert will show automatically
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!formData.comment.trim()) return;

        // ✅ Check again before submitting
        const hasSubmitted = await checkFeedbackStatus(
            parseInt(formData.election_id),
        );
        if (hasSubmitted) {
            return; // Alert will already be shown
        }

        setSubmitting(true);
        try {
            await feedbackAPI.create(formData);
            setIsDialogOpen(false);
            resetForm();
            fetchFeedback();
        } catch (error: any) {
            console.error("Failed to submit feedback:", error);
            if (error.response?.data?.code === "already_submitted") {
                const election = elections.find(
                    (e) => e.election_id === parseInt(formData.election_id),
                );
                setSubmittedAlert({
                    show: true,
                    electionTitle: election?.title || "this election",
                    feedback: null,
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!formData.comment.trim() || !editingFeedback) return;

        setSubmitting(true);
        try {
            await feedbackAPI.update(editingFeedback.feedback_id, {
                category_id: formData.category_id,
                rating: formData.rating,
                title: formData.title,
                comment: formData.comment,
                is_public: formData.is_public,
                is_anonymous: formData.is_anonymous,
            });
            setIsDialogOpen(false);
            resetForm();
            setEditingFeedback(null);
            setSubmittedAlert({
                show: false,
                electionTitle: "",
                feedback: null,
            });
            fetchFeedback();
        } catch (error) {
            console.error("Failed to update feedback:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number): Promise<void> => {
        if (!confirm("Are you sure you want to delete your feedback?")) return;
        try {
            await feedbackAPI.delete(id);
            fetchFeedback();
            setDeleteConfirm(null);
            setSubmittedAlert({
                show: false,
                electionTitle: "",
                feedback: null,
            });
        } catch (error) {
            console.error("Failed to delete feedback:", error);
        }
    };

    const handleEdit = (feedbackItem: Feedback) => {
        setEditingFeedback(feedbackItem);
        setFormData({
            election_id: feedbackItem.election?.election_id.toString() || "",
            category_id: feedbackItem.category_id?.toString() || "",
            rating: feedbackItem.rating || 5,
            title: feedbackItem.title || "",
            comment: feedbackItem.comment || "",
            is_public:
                feedbackItem.is_public !== undefined
                    ? feedbackItem.is_public
                    : true,
            is_anonymous:
                feedbackItem.is_anonymous !== undefined
                    ? feedbackItem.is_anonymous
                    : false,
        });
        setIsDialogOpen(true);
    };

    const resetForm = (): void => {
        setFormData({
            election_id: elections[0]?.election_id?.toString() || "",
            category_id: "",
            rating: 5,
            title: "",
            comment: "",
            is_public: true,
            is_anonymous: false,
        });
        setHoverRating(null);
        setEditingFeedback(null);
        setSubmittedAlert({ show: false, electionTitle: "", feedback: null });
    };

    const handleMarkHelpful = async (id: number): Promise<void> => {
        try {
            await feedbackAPI.markHelpful(id);
            fetchFeedback();
        } catch (error) {
            console.error("Failed to mark helpful:", error);
        }
    };

    const getRatingColor = (rating: number): string => {
        if (rating >= 4) return "text-green-600";
        if (rating >= 3) return "text-blue-600";
        if (rating >= 2) return "text-yellow-600";
        return "text-red-600";
    };

    const getRatingBgColor = (rating: number): string => {
        if (rating >= 4) return "bg-green-100";
        if (rating >= 3) return "bg-blue-100";
        if (rating >= 2) return "bg-yellow-100";
        return "bg-red-100";
    };

    const getStarIcon = (rating: number) => {
        if (rating >= 4)
            return <Star className="w-4 h-4 text-green-500 fill-green-500" />;
        if (rating === 3)
            return <Star className="w-4 h-4 text-blue-500 fill-blue-500" />;
        if (rating === 2)
            return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
        return <Star className="w-4 h-4 text-red-500 fill-red-500" />;
    };

    const getInitials = (firstName?: string, lastName?: string): string => {
        return (
            `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?"
        );
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
            />
        ));
    };

    const pieData = stats.ratingDistribution
        .map((item) => ({
            name: `${item.rating} Star${item.rating > 1 ? "s" : ""}`,
            value: item.count,
            color:
                item.rating >= 4
                    ? "#10b981"
                    : item.rating === 3
                      ? "#3b82f6"
                      : item.rating === 2
                        ? "#f59e0b"
                        : "#ef4444",
        }))
        .filter((item) => item.value > 0);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ✅ Alert for already submitted feedback */}
            {submittedAlert.show && (
                <div className="fixed top-20 right-4 z-50 max-w-md animate-in slide-in-from-right-5 duration-300">
                    <div className="rounded-lg border p-4 shadow-lg bg-yellow-50 border-yellow-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-yellow-800">
                                    You've Already Submitted Feedback
                                </h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                    You have already written feedback for{" "}
                                    <strong>
                                        {submittedAlert.electionTitle}
                                    </strong>
                                    . You can edit or delete your existing
                                    feedback below.
                                </p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {submittedAlert.feedback && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                                onClick={() => {
                                                    setSubmittedAlert({
                                                        show: false,
                                                        electionTitle: "",
                                                        feedback: null,
                                                    });
                                                    if (
                                                        submittedAlert.feedback
                                                    ) {
                                                        handleEdit(
                                                            submittedAlert.feedback,
                                                        );
                                                    }
                                                }}
                                            >
                                                <Edit className="w-3 h-3 mr-1" />
                                                Edit Feedback
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-300 text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    if (
                                                        submittedAlert.feedback
                                                    ) {
                                                        handleDelete(
                                                            submittedAlert
                                                                .feedback
                                                                .feedback_id,
                                                        );
                                                        setSubmittedAlert({
                                                            show: false,
                                                            electionTitle: "",
                                                            feedback: null,
                                                        });
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                Delete
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={() =>
                                            setSubmittedAlert({
                                                show: false,
                                                electionTitle: "",
                                                feedback: null,
                                            })
                                        }
                                    >
                                        <X className="w-4 h-4" />
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                            <button
                                onClick={() =>
                                    setSubmittedAlert({
                                        show: false,
                                        electionTitle: "",
                                        feedback: null,
                                    })
                                }
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ Header */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 via-indigo-600 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Voice Your Opinion
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                Election Feedback
                            </h1>
                            <p className="text-blue-100 mt-1">
                                Share your experience and help us improve future
                                elections
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg rounded-xl px-6"
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Write Feedback
                        </Button>
                    </div>
                </div>
            </div>

            {/* ✅ Stats Pills */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Total Feedback
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {stats.total}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                        Average Rating
                    </span>
                    <span className="text-sm font-bold text-yellow-800">
                        {stats.avgRating.toFixed(1)} / 5.0
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        Helpful Votes
                    </span>
                    <span className="text-sm font-bold text-green-800">
                        {stats.helpfulTotal}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                        Respondents
                    </span>
                    <span className="text-sm font-bold text-purple-800">
                        {feedback.filter((f) => f.user?.user_id).length}
                    </span>
                </div>
            </div>

            {/* ✅ Charts */}
            {stats.total > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <PieChartIcon className="w-5 h-5 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-900">
                                Rating Distribution
                            </h3>
                        </div>
                        {pieData.length > 0 ? (
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                            label={({ name, percent }) =>
                                                `${name}: ${(percent * 100).toFixed(0)}%`
                                            }
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-gray-500">
                                No rating data available
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-green-600" />
                            <h3 className="text-sm font-semibold text-gray-900">
                                Rating Breakdown
                            </h3>
                        </div>
                        {stats.ratingDistribution.some((d) => d.count > 0) ? (
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.ratingDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="rating"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"
                                            fill="#3b82f6"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-gray-500">
                                No rating data available
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ✅ Error Message */}
            {error && (
                <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* ✅ Filters */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Filter Feedback
                        </h3>
                    </div>
                </div>
                <div className="p-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                activeFilter === "all" && !selectedRating
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            onClick={() => {
                                setActiveFilter("all");
                                setSelectedRating(null);
                            }}
                        >
                            All ({feedback.length})
                        </button>
                        <button
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                                activeFilter === "high-rating"
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            onClick={() => {
                                setActiveFilter("high-rating");
                                setSelectedRating(null);
                            }}
                        >
                            <Star className="w-3 h-3 fill-current" />
                            4-5 Stars
                        </button>
                        <button
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                activeFilter === "mid-rating"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            onClick={() => {
                                setActiveFilter("mid-rating");
                                setSelectedRating(null);
                            }}
                        >
                            <Star className="w-3 h-3" />3 Stars
                        </button>
                        <button
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                activeFilter === "low-rating"
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            onClick={() => {
                                setActiveFilter("low-rating");
                                setSelectedRating(null);
                            }}
                        >
                            <Star className="w-3 h-3" />
                            1-2 Stars
                        </button>
                        <button
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                activeFilter === "with_response"
                                    ? "bg-teal-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            onClick={() => setActiveFilter("with_response")}
                        >
                            <MessageCircle className="w-3 h-3" />
                            With Response
                        </button>
                        <div className="flex-1"></div>
                        <div className="relative w-48">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search feedback..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 rounded-xl bg-gray-50 border-gray-200 h-9 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ Feedback List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                        <p className="text-gray-500 mt-4">
                            Loading feedback...
                        </p>
                    </div>
                ) : filteredFeedback.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            No Feedback Found
                        </h3>
                        <p className="text-gray-500">
                            {feedback.length === 0
                                ? "No feedback has been submitted yet. Be the first to share your thoughts!"
                                : "No feedback matches your current filters."}
                        </p>
                        {feedback.length > 0 && (
                            <Button
                                variant="outline"
                                className="mt-4 rounded-xl"
                                onClick={() => {
                                    setActiveFilter("all");
                                    setSelectedRating(null);
                                    setSearchTerm("");
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                        {feedback.length === 0 && (
                            <Button
                                className="mt-4 rounded-xl bg-blue-600 to-indigo-600"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Write Feedback
                            </Button>
                        )}
                    </div>
                ) : (
                    filteredFeedback.map((item) => (
                        <div
                            key={item.feedback_id}
                            className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6"
                        >
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div className="flex-1">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                                        <div
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingBgColor(item.rating)} ${getRatingColor(item.rating)} flex items-center gap-1`}
                                        >
                                            {getStarIcon(item.rating)}
                                            <span>{item.rating}/5</span>
                                        </div>
                                        {item.category_name && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                {item.category_name}
                                            </Badge>
                                        )}
                                        <span className="text-sm text-gray-400 flex items-center gap-1">
                                            {item.is_anonymous ? (
                                                <User className="w-3 h-3" />
                                            ) : (
                                                <User className="w-3 h-3" />
                                            )}
                                            {item.is_anonymous
                                                ? "Anonymous"
                                                : item.user?.first_name ||
                                                  "Unknown User"}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(
                                                item.created_at,
                                            ).toLocaleDateString()}
                                        </span>
                                        {item.election && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs bg-gray-50"
                                            >
                                                {item.election.title}
                                            </Badge>
                                        )}
                                        {/* ✅ Show edit/delete for user's own feedback */}
                                        {item.user?.user_id ===
                                            user?.user_id && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() =>
                                                        handleEdit(item)
                                                    }
                                                >
                                                    <Edit className="w-3 h-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() =>
                                                        handleDelete(
                                                            item.feedback_id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="w-3 h-3 mr-1" />
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                    {/* Title */}
                                    {item.title && (
                                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                            {item.title}
                                        </h3>
                                    )}

                                    {/* Comment */}
                                    <p className="text-gray-600 leading-relaxed">
                                        {item.comment}
                                    </p>

                                    {/* Admin Response */}
                                    {item.admin_response && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="flex items-start gap-2">
                                                <Award className="w-4 h-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-blue-800">
                                                        Admin Response:
                                                    </p>
                                                    <p className="text-sm text-blue-700">
                                                        {item.admin_response}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Helpful Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        handleMarkHelpful(item.feedback_id)
                                    }
                                    className="flex items-center gap-2 hover:bg-green-50 transition-colors flex-shrink-0"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    <span className="font-medium">
                                        {item.helpful_count || 0}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        helpful
                                    </span>
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ✅ Feedback Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0">
                    <div className="bg-blue-600 via-indigo-600 px-6 py-4 rounded-t-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-white flex items-center gap-2">
                                {editingFeedback ? (
                                    <Edit className="w-5 h-5" />
                                ) : (
                                    <MessageCircle className="w-5 h-5" />
                                )}
                                {editingFeedback
                                    ? "Edit Your Feedback"
                                    : "Share Your Feedback"}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-6">
                        <form
                            onSubmit={
                                editingFeedback ? handleUpdate : handleSubmit
                            }
                            className="space-y-5"
                        >
                            {/* Election */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">
                                    Select Election *
                                </Label>
                                <Select
                                    value={formData.election_id}
                                    onValueChange={(value) =>
                                        handleElectionChange(value)
                                    }
                                    disabled={!!editingFeedback}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select an election" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {elections.map((election) => (
                                            <SelectItem
                                                key={election.election_id}
                                                value={election.election_id.toString()}
                                            >
                                                {election.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {editingFeedback && (
                                    <p className="text-xs text-gray-400">
                                        You are editing feedback for:{" "}
                                        {editingFeedback.election?.title}
                                    </p>
                                )}
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">
                                    Category
                                </Label>
                                <Select
                                    value={formData.category_id}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            category_id: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select a category (Optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category.category_id}
                                                value={category.category_id.toString()}
                                            >
                                                {category.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Rating */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">
                                    Rating *
                                </Label>
                                <div className="flex gap-3 py-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    rating: star,
                                                })
                                            }
                                            onMouseEnter={() =>
                                                setHoverRating(star)
                                            }
                                            onMouseLeave={() =>
                                                setHoverRating(null)
                                            }
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-10 h-10 transition-colors ${
                                                    star <=
                                                    (hoverRating ??
                                                        formData.rating)
                                                        ? "text-yellow-400 fill-yellow-400"
                                                        : "text-gray-300"
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">
                                    Title (Optional)
                                </Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            title: e.target.value,
                                        })
                                    }
                                    placeholder="Summarize your feedback"
                                    className="rounded-xl"
                                />
                            </div>

                            {/* Comment */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">
                                    Comment *
                                </Label>
                                <Textarea
                                    value={formData.comment}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            comment: e.target.value,
                                        })
                                    }
                                    placeholder="Share your detailed feedback..."
                                    rows={5}
                                    required
                                    className="rounded-xl resize-none"
                                />
                            </div>

                            {/* Privacy Settings */}
                            <div className="space-y-3">
                                <Label className="text-gray-700 font-medium">
                                    Privacy Settings
                                </Label>
                                <div className="flex flex-wrap gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_public}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    is_public: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Make my feedback public
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_anonymous}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    is_anonymous:
                                                        e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Post anonymously
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsDialogOpen(false);
                                        resetForm();
                                    }}
                                    className="rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        submitting || !formData.comment.trim()
                                    }
                                    className="bg-blue-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl px-6"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : editingFeedback ? (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                    ) : (
                                        <Send className="w-4 h-4 mr-2" />
                                    )}
                                    {editingFeedback
                                        ? "Update Feedback"
                                        : "Submit Feedback"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ✅ Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-start space-x-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-800">
                            Why Your Feedback Matters
                        </h4>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1">
                            <li>
                                • Your feedback helps improve future elections
                            </li>
                            <li>
                                • Share your experience to help other voters
                            </li>
                            <li>• Help us identify areas for improvement</li>
                            <li>
                                • You can edit or delete your feedback anytime
                            </li>
                            <li>• Only one feedback per election is allowed</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackPage;
