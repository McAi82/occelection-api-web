// resources/js/pages/Admin/ManagePositions.tsx
import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { RefreshButton } from "../components/common/RefreshButton";
import { adminAPI } from "../api/admin";
import { electionAPI } from "../api/elections";
import { useElections } from "../hooks/useElections";
import {
    Plus,
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Award,
    Calendar,
    Users,
    Search,
    ChevronLeft,
    ChevronRight,
    List,
    LayoutGrid,
    ArrowUpDown,
    Pencil,
    Trash,
    Sparkles,
} from "lucide-react";

type ViewMode = "list" | "grid";

interface Position {
    position_id: number;
    title: string;
    category?: string;
    position_type?: string;
    max_winners: number;
    order_in_ballot: number;
    description?: string;
    candidates_count?: number;
    created_at?: string;
}

interface FormData {
    title: string;
    category: string;
    position_type: string;
    max_winners: number;
    order_in_ballot: number;
    description: string;
}

const CATEGORIES = ["Executive", "Secretariat", "Senate", "Finance", "Other"];

const POSITION_TYPES = [
    { value: "executive", label: "Executive" },
    { value: "secretary", label: "Secretary" },
    { value: "senator", label: "Senator" },
    { value: "governor", label: "Governor" },
    { value: "finance", label: "Finance" },
    { value: "other", label: "Other" },
];

const ManagePositions: React.FC = () => {
    const {
        data: elections = [],
        isLoading: electionsLoading,
        refetch: refetchElections,
    } = useElections();
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [positions, setPositions] = useState<Position[]>([]);
    const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(
        null,
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        title: "",
        category: "",
        position_type: "",
        max_winners: 1,
        order_in_ballot: 0,
        description: "",
    });
    const [toast, setToast] = useState<{
        type: "success" | "error";
        title: string;
        message: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);

    useEffect(() => {
        if (elections.length > 0 && !selectedElection) {
            setSelectedElection(elections[0].election_id.toString());
        }
    }, [elections]);

    useEffect(() => {
        if (selectedElection) {
            fetchPositions();
        }
    }, [selectedElection]);

    useEffect(() => {
        filterPositions();
    }, [positions, searchTerm]);

    const fetchPositions = async () => {
        if (!selectedElection) return;
        setLoading(true);
        setRefreshing(true);
        try {
            const response = await electionAPI.getById(selectedElection);
            const electionData = response.data;
            let positionsData = [];
            if (electionData?.data?.positions) {
                positionsData = electionData.data.positions;
            } else if (electionData?.positions) {
                positionsData = electionData.positions;
            } else if (Array.isArray(electionData)) {
                positionsData = electionData;
            }
            setPositions(positionsData);
            setFilteredPositions(positionsData);
        } catch (error) {
            console.error("Failed to fetch positions:", error);
            showToast("error", "Error", "Failed to load positions");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterPositions = () => {
        if (!searchTerm.trim()) {
            setFilteredPositions(positions);
            return;
        }
        const term = searchTerm.toLowerCase();
        const filtered = positions.filter(
            (pos) =>
                pos.title.toLowerCase().includes(term) ||
                (pos.category && pos.category.toLowerCase().includes(term)) ||
                (pos.position_type &&
                    pos.position_type.toLowerCase().includes(term)),
        );
        setFilteredPositions(filtered);
    };

    const showToast = (
        type: "success" | "error",
        title: string,
        message: string,
    ) => {
        setToast({ type, title, message });
        setTimeout(() => setToast(null), 5000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setToast(null);

        try {
            if (editingPosition) {
                await adminAPI.updatePosition(editingPosition.position_id, {
                    title: formData.title,
                    category: formData.category,
                    position_type: formData.position_type,
                    max_winners: formData.max_winners,
                    order_in_ballot: formData.order_in_ballot,
                    description: formData.description,
                });
                showToast(
                    "success",
                    "Position Updated",
                    `"${formData.title}" has been updated successfully`,
                );
            } else {
                await adminAPI.createPosition({
                    election_id: selectedElection,
                    title: formData.title,
                    category: formData.category,
                    position_type: formData.position_type,
                    max_winners: formData.max_winners,
                    order_in_ballot: formData.order_in_ballot,
                    description: formData.description,
                });
                showToast(
                    "success",
                    "Position Created",
                    `"${formData.title}" has been created successfully`,
                );
            }

            setIsDialogOpen(false);
            resetForm();
            await fetchPositions();
        } catch (error: any) {
            console.error("Failed to save position:", error);
            showToast(
                "error",
                "Error",
                error.response?.data?.message || "Failed to save position",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (position: Position) => {
        if (
            !window.confirm(
                `Are you sure you want to delete "${position.title}"? This will also remove all candidates associated with this position.`,
            )
        ) {
            return;
        }

        setIsDeleting(position.position_id);
        try {
            await adminAPI.deletePosition(position.position_id);
            showToast(
                "success",
                "Position Deleted",
                `"${position.title}" has been deleted`,
            );
            await fetchPositions();
        } catch (error: any) {
            console.error("Failed to delete position:", error);
            showToast(
                "error",
                "Error",
                error.response?.data?.message || "Failed to delete position",
            );
        } finally {
            setIsDeleting(null);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            category: "",
            position_type: "",
            max_winners: 1,
            order_in_ballot: 0,
            description: "",
        });
        setEditingPosition(null);
    };

    const openEditDialog = (position: Position) => {
        setEditingPosition(position);
        setFormData({
            title: position.title,
            category: position.category || "",
            position_type: position.position_type || "",
            max_winners: position.max_winners || 1,
            order_in_ballot: position.order_in_ballot || 0,
            description: position.description || "",
        });
        setIsDialogOpen(true);
    };

    const openCreateDialog = () => {
        resetForm();
        const maxOrder = positions.reduce(
            (max, p) => Math.max(max, p.order_in_ballot),
            0,
        );
        setFormData((prev) => ({
            ...prev,
            order_in_ballot: maxOrder + 1,
        }));
        setIsDialogOpen(true);
    };

    const handleMovePosition = async (
        positionId: number,
        direction: "up" | "down",
    ) => {
        const index = positions.findIndex((p) => p.position_id === positionId);
        if (index === -1) return;

        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= positions.length) return;

        const sortedPositions = [...positions];
        const temp = sortedPositions[index];
        sortedPositions[index] = sortedPositions[newIndex];
        sortedPositions[newIndex] = temp;

        const updatedPositions = sortedPositions.map((pos, idx) => ({
            ...pos,
            order_in_ballot: idx + 1,
        }));

        try {
            for (const pos of updatedPositions) {
                await adminAPI.updatePosition(pos.position_id, {
                    order_in_ballot: pos.order_in_ballot,
                });
            }
            showToast(
                "success",
                "Order Updated",
                "Position order has been updated",
            );
            await fetchPositions();
        } catch (error) {
            console.error("Failed to update order:", error);
            showToast("error", "Error", "Failed to update position order");
        }
    };

    const getCategoryColor = (category?: string) => {
        const colors: Record<string, string> = {
            Executive: "bg-blue-100 text-blue-700",
            Secretariat: "bg-purple-100 text-purple-700",
            Senate: "bg-green-100 text-green-700",
            Finance: "bg-yellow-100 text-yellow-700",
            Other: "bg-gray-100 text-gray-700",
        };
        return colors[category || "Other"] || colors.Other;
    };

    const getPositionTypeLabel = (type?: string) => {
        const found = POSITION_TYPES.find((t) => t.value === type);
        return found ? found.label : type || "Other";
    };

    const totalPages = Math.ceil(filteredPositions.length / perPage);
    const paginatedPositions = filteredPositions.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage,
    );

    const totalPositions = positions.length;

    if (electionsLoading || (loading && !positions.length)) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Position Management
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                Manage Positions
                            </h1>
                            <p className="text-blue-100 mt-1">
                                Configure election positions and their order
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                                <Award className="w-4 h-4 mr-1" />
                                {totalPositions} Positions
                            </Badge>
                            <RefreshButton
                                onClick={fetchPositions}
                                isLoading={refreshing}
                            />
                            <Button
                                onClick={openCreateDialog}
                                className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Position
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notifications */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-md ${
                        toast.type === "success"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {toast.type === "success" ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        <div>
                            <p className="font-bold">{toast.title}</p>
                            <p className="text-sm">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => setToast(null)}
                            className="ml-4 text-gray-500 hover:text-gray-700"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Election Selector */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Select Election
                    </CardTitle>
                </div>
                <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <select
                            className="w-full md:w-80 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
                            value={selectedElection}
                            onChange={(e) => {
                                setSelectedElection(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">Select an election</option>
                            {elections.map((election: any) => (
                                <option
                                    key={election.election_id}
                                    value={election.election_id}
                                >
                                    {election.title} ({election.election_type})
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search positions..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10 rounded-xl bg-gray-50 border-gray-200"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                    >
                                        <XCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 flex-shrink-0">
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
                    </div>
                </CardContent>
            </Card>

            {/* Stats - Pill/Badge Style */}
            <div className="flex flex-wrap gap-3 py-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Total</span>
                    <span className="text-sm font-bold text-gray-900">{positions.length}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Executive</span>
                    <span className="text-sm font-bold text-blue-800">{positions.filter(p => p.category === "Executive").length}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Secretariat</span>
                    <span className="text-sm font-bold text-purple-800">{positions.filter(p => p.category === "Secretariat").length}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Senate</span>
                    <span className="text-sm font-bold text-green-800">{positions.filter(p => p.category === "Senate").length}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Other</span>
                    <span className="text-sm font-bold text-gray-700">{positions.filter(p => p.category === "Other" || !p.category).length}</span>
                </div>
            </div>

            {/* Results Count */}
            {searchTerm && filteredPositions.length > 0 && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                    Showing {filteredPositions.length} of {positions.length}{" "}
                    positions matching "{searchTerm}"
                </div>
            )}

            {/* Positions Display */}
            {filteredPositions.length === 0 ? (
                <Card className="rounded-xl border-0 shadow-lg">
                    <CardContent className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Award className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No Positions Found
                        </h3>
                        <p className="text-gray-500">
                            {positions.length === 0
                                ? "No positions created for this election yet"
                                : searchTerm
                                  ? `No positions matching "${searchTerm}"`
                                  : "No positions found"}
                        </p>
                        {searchTerm && positions.length > 0 && (
                            <Button
                                variant="link"
                                onClick={() => setSearchTerm("")}
                                className="mt-4"
                            >
                                Clear search
                            </Button>
                        )}
                        {positions.length === 0 && (
                            <Button
                                className="mt-4 bg-blue-600 hover:bg-blue-700"
                                onClick={openCreateDialog}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add Your First
                                Position
                            </Button>
                        )}
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
                                            <div className="flex items-center gap-1">
                                                Order
                                                <ArrowUpDown className="w-3 h-3 text-gray-400" />
                                            </div>
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Position
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Category
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Type
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Winners
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Candidates
                                        </th>
                                        <th className="text-right p-4 text-sm font-semibold text-gray-700">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedPositions.map((position) => (
                                        <tr
                                            key={position.position_id}
                                            className="hover:bg-blue-50/30 transition-colors group"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-gray-900 w-8 text-center">
                                                        {
                                                            position.order_in_ballot
                                                        }
                                                    </span>
                                                    <div className="flex flex-col">
                                                        <button
                                                            onClick={() =>
                                                                handleMovePosition(
                                                                    position.position_id,
                                                                    "up",
                                                                )
                                                            }
                                                            className="p-0.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30"
                                                            disabled={
                                                                position.order_in_ballot ===
                                                                1
                                                            }
                                                        >
                                                            <ChevronLeft className="w-3 h-3 text-gray-400 rotate-90" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleMovePosition(
                                                                    position.position_id,
                                                                    "down",
                                                                )
                                                            }
                                                            className="p-0.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30"
                                                            disabled={
                                                                position.order_in_ballot ===
                                                                positions.length
                                                            }
                                                        >
                                                            <ChevronRight className="w-3 h-3 text-gray-400 rotate-90" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {position.title.charAt(
                                                            0,
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {position.title}
                                                        </p>
                                                        {position.description && (
                                                            <p className="text-xs text-gray-400 line-clamp-1">
                                                                {
                                                                    position.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    className={getCategoryColor(
                                                        position.category,
                                                    )}
                                                >
                                                    {position.category ||
                                                        "Other"}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs font-medium text-gray-600">
                                                    {getPositionTypeLabel(
                                                        position.position_type,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {position.max_winners}{" "}
                                                    {position.max_winners > 1
                                                        ? "winners"
                                                        : "winner"}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs bg-blue-50 text-blue-700"
                                                >
                                                    {position.candidates_count ||
                                                        0}{" "}
                                                    candidates
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                                                        onClick={() =>
                                                            openEditDialog(
                                                                position,
                                                            )
                                                        }
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                                                        onClick={() =>
                                                            handleDelete(
                                                                position,
                                                            )
                                                        }
                                                        disabled={
                                                            isDeleting ===
                                                            position.position_id
                                                        }
                                                    >
                                                        {isDeleting ===
                                                        position.position_id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
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
                                <span className="text-sm text-gray-500">
                                    Page {currentPage} of {totalPages} (
                                    {filteredPositions.length} positions)
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(totalPages, p + 1),
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedPositions.map((position) => (
                        <Card
                            key={position.position_id}
                            className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                        >
                            <div className="h-1.5 bg-blue-500" />
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            #{position.order_in_ballot}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">
                                                {position.title}
                                            </h3>
                                            <p className="text-xs text-gray-400">
                                                {position.category ||
                                                    "Uncategorized"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                                            onClick={() =>
                                                openEditDialog(position)
                                            }
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                                            onClick={() =>
                                                handleDelete(position)
                                            }
                                            disabled={
                                                isDeleting ===
                                                position.position_id
                                            }
                                        >
                                            {isDeleting ===
                                            position.position_id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Trash className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge
                                        className={getCategoryColor(
                                            position.category,
                                        )}
                                    >
                                        {position.category || "Other"}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {position.max_winners} winner
                                        {position.max_winners > 1 ? "s" : ""}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs bg-blue-50 text-blue-700"
                                    >
                                        {position.candidates_count || 0}{" "}
                                        candidates
                                    </Badge>
                                </div>
                                {position.description && (
                                    <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                                        {position.description}
                                    </p>
                                )}
                                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        {getPositionTypeLabel(
                                            position.position_type,
                                        )}
                                    </span>
                                    <span>
                                        {position.created_at
                                            ? new Date(
                                                  position.created_at,
                                              ).toLocaleDateString()
                                            : ""}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <Award className="w-5 h-5 text-blue-600" />
                            {editingPosition
                                ? "Edit Position"
                                : "Create New Position"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 py-2">
                        {toast && toast.type === "error" && (
                            <Alert variant="destructive" className="rounded-xl">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {toast.message}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Position Title *
                            </Label>
                            <Input
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        title: e.target.value,
                                    })
                                }
                                placeholder="e.g., CSG President"
                                required
                                className="rounded-xl border-2 focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">
                                    Category
                                </Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            category: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">
                                    Position Type
                                </Label>
                                <Select
                                    value={formData.position_type}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            position_type: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {POSITION_TYPES.map((type) => (
                                            <SelectItem
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">
                                    Max Winners
                                </Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.max_winners}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            max_winners:
                                                parseInt(e.target.value) || 1,
                                        })
                                    }
                                    className="rounded-xl border-2 focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">
                                    Order in Ballot
                                </Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.order_in_ballot}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            order_in_ballot:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="rounded-xl border-2 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-400">
                                    Lower numbers appear first on ballot
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Description (Optional)
                            </Label>
                            <Input
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Brief description of the position..."
                                className="rounded-xl border-2 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : editingPosition ? (
                                    "Update Position"
                                ) : (
                                    "Create Position"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManagePositions;