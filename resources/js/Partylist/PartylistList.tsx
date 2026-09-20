// resources/js/pages/Partylist/PartylistList.tsx
import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";
import { partylistAPI, Partylist } from "../api/partylists";
import { useAuth } from "../contexts/AuthContext";
import {
    Building2,
    Users,
    RefreshCw,
    Filter,
    UserCheck,
    UserX,
    XCircle,
    Loader2,
    Search,
    LayoutGrid,
    List,
    ChevronRight,
    AlertCircle,
    Calendar,
} from "lucide-react";

type ViewMode = "list" | "grid";
type FilterType = "all" | "with_candidates" | "without_candidates";

const PartylistList: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [partylists, setPartylists] = useState<Partylist[]>([]);
    const [filteredPartylists, setFilteredPartylists] = useState<Partylist[]>(
        [],
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [selectedYear, setSelectedYear] = useState<number>(
        new Date().getFullYear(),
    );
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [loadingYears, setLoadingYears] = useState(true);

    useEffect(() => {
        fetchAvailableYears();
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchPartylists();
        }
    }, [selectedYear]);

    useEffect(() => {
        filterPartylists();
    }, [partylists, filter, searchTerm]);

    const fetchAvailableYears = async (): Promise<void> => {
        setLoadingYears(true);
        try {
            const response = await partylistAPI.getAvailableYears();
            let years: number[] = [];
            if (response.data?.data) {
                years = response.data.data;
            } else if (Array.isArray(response.data)) {
                years = response.data;
            }
            if (years.length > 0) {
                setAvailableYears(years);
                setSelectedYear(years[0]);
            } else {
                const currentYear = new Date().getFullYear();
                setAvailableYears([currentYear]);
                setSelectedYear(currentYear);
            }
        } catch (error) {
            console.error("Failed to fetch available years:", error);
            const currentYear = new Date().getFullYear();
            setAvailableYears([currentYear]);
            setSelectedYear(currentYear);
        } finally {
            setLoadingYears(false);
        }
    };

    const fetchPartylists = async (): Promise<void> => {
        if (!selectedYear) return;
        setLoading(true);
        setError("");
        try {
            const response = await partylistAPI.getByYear(selectedYear);
            let partylistsData: Partylist[] = [];
            if (response.data?.data) {
                partylistsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                partylistsData = response.data;
            }
            setPartylists(partylistsData);
            setFilteredPartylists(partylistsData);
        } catch (error: any) {
            console.error("Failed to fetch partylists:", error);
            setError(
                error.response?.data?.message || "Failed to load partylists",
            );
            setPartylists([]);
            setFilteredPartylists([]);
        } finally {
            setLoading(false);
        }
    };

    const getCandidateCount = (partylist: Partylist): number => {
        return partylist.candidates_count ?? 0;
    };

    const filterPartylists = (): void => {
        let filtered = [...partylists];
        if (filter === "with_candidates") {
            filtered = filtered.filter((p) => getCandidateCount(p) > 0);
        } else if (filter === "without_candidates") {
            filtered = filtered.filter((p) => getCandidateCount(p) === 0);
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    (p.description &&
                        p.description.toLowerCase().includes(term)),
            );
        }
        setFilteredPartylists(filtered);
    };

    const getImageUrl = (path?: string): string | null => {
        if (!path || path.startsWith("http")) return path || null;
        return `${path}`;
    };

    const viewPartylistDetails = (partylist: Partylist): void => {
        navigate(`/partylists/${partylist.partylist_id}`);
    };

    const stats = {
        withCandidates: partylists.filter((p) => getCandidateCount(p) > 0)
            .length,
        withoutCandidates: partylists.filter((p) => getCandidateCount(p) === 0)
            .length,
        total: partylists.length,
        totalCandidates: partylists.reduce(
            (acc, p) => acc + getCandidateCount(p),
            0,
        ),
    };

    if (loadingYears || (loading && !partylists.length)) {
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
                                <Building2 className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Political Partylists
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                Partylists {selectedYear}
                            </h1>
                            <p className="text-blue-100 mt-1">
                                Browse political partylists for the year{" "}
                                {selectedYear}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={fetchPartylists}
                            disabled={loading}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                            <RefreshCw
                                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                            />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Year Selector */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Select Year
                    </CardTitle>
                </div>
                <CardContent className="p-5">
                    <div className="flex flex-wrap gap-2">
                        {availableYears.length > 0 ? (
                            availableYears.map((year) => (
                                <Button
                                    key={year}
                                    variant={
                                        selectedYear === year
                                            ? "default"
                                            : "outline"
                                    }
                                    onClick={() => setSelectedYear(year)}
                                    className={
                                        selectedYear === year
                                            ? "bg-blue-600"
                                            : ""
                                    }
                                >
                                    {year}
                                </Button>
                            ))
                        ) : (
                            <p className="text-gray-500">No years available</p>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                        Showing partylists from the database for the selected                        year
                    </p>
                </CardContent>
            </Card>

            {/* Stats - Pill/Badge Style */}
            {partylists.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 py-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">
                            Total
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                            {stats.total}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                        <UserCheck className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            With Candidates
                        </span>
                        <span className="text-sm font-bold text-green-800">
                            {stats.withCandidates}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full">
                        <UserX className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">
                            No Candidates
                        </span>
                        <span className="text-sm font-bold text-orange-800">
                            {stats.withoutCandidates}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">
                            Total Members
                        </span>
                        <span className="text-sm font-bold text-purple-800">
                            {stats.totalCandidates}
                        </span>
                    </div>
                </div>
            )}

            {/* Filters */}
            {partylists.length > 0 && (
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-600" />
                            Filters
                        </CardTitle>
                    </div>
                    <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="flex gap-2 flex-wrap">
                                <Button
                                    variant={
                                        filter === "all" ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setFilter("all")}
                                    className={
                                        filter === "all"
                                            ? "bg-blue-600"
                                            : ""
                                    }
                                >
                                    All ({stats.total})
                                </Button>
                                <Button
                                    variant={
                                        filter === "with_candidates"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setFilter("with_candidates")}
                                    className={
                                        filter === "with_candidates"
                                            ? "bg-green-600"
                                            : ""
                                    }
                                >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    With Candidates ({stats.withCandidates})
                                </Button>
                                <Button
                                    variant={
                                        filter === "without_candidates"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                        setFilter("without_candidates")
                                    }
                                    className={
                                        filter === "without_candidates"
                                            ? "bg-orange-600"
                                            : ""
                                    }
                                >
                                    <UserX className="w-4 h-4 mr-2" />
                                    No Candidates ({stats.withoutCandidates})
                                </Button>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search partylists..."
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
            )}

            {/* Results Count */}
            {(filter !== "all" || searchTerm) &&
                filteredPartylists.length > 0 && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                        Showing {filteredPartylists.length} of{" "}
                        {partylists.length} partylists
                        {filter === "with_candidates" && " with candidates"}
                        {filter === "without_candidates" &&
                            " without candidates"}
                        {searchTerm && ` matching "${searchTerm}"`}
                    </div>
                )}

            {/* Partylists Display */}
            {loading && partylists.length === 0 ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : filteredPartylists.length === 0 ? (
                <Card className="rounded-xl border-0 shadow-lg">
                    <CardContent className="text-center py-16">
                        <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No Partylists Found
                        </h3>
                        <p className="text-gray-500">
                            {partylists.length === 0
                                ? `No partylists found for the year ${selectedYear}`
                                : filter === "with_candidates"
                                  ? "No partylists with candidates found"
                                  : filter === "without_candidates"
                                    ? "No partylists without candidates found"
                                    : searchTerm
                                      ? `No partylists matching "${searchTerm}"`
                                      : "No partylists found"}
                        </p>
                        {(filter !== "all" || searchTerm) &&
                            partylists.length > 0 && (
                                <Button
                                    variant="link"
                                    onClick={() => {
                                        setFilter("all");
                                        setSearchTerm("");
                                    }}
                                    className="mt-4"
                                >
                                    Clear filters
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
                                            Partylist
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Description
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Members
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Creator
                                        </th>
                                        <th className="text-right p-4 text-sm font-semibold text-gray-700">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredPartylists.map((partylist) => (
                                        <tr
                                            key={partylist.partylist_id}
                                            className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                            onClick={() =>
                                                viewPartylistDetails(partylist)
                                            }
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {partylist.logo_url ? (
                                                        <img
                                                            src={
                                                                getImageUrl(
                                                                    partylist.logo_url,
                                                                ) || ""
                                                            }
                                                            alt={partylist.name}
                                                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display =
                                                                    "none";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Building2 className="w-5 h-5 text-white" />
                                                        </div>
                                                    )}
                                                    <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {partylist.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-gray-600 line-clamp-1">
                                                    {partylist.description ||
                                                        "-"}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant="outline"
                                                    className="text-sm"
                                                >
                                                    <Users className="w-3 h-3 mr-1" />
                                                    {partylist.candidates_count ||
                                                        0}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-gray-600">
                                                    {partylist.creator
                                                        ? `${partylist.creator.first_name} ${partylist.creator.last_name}`
                                                        : "-"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        viewPartylistDetails(
                                                            partylist,
                                                        );
                                                    }}
                                                >
                                                    View Details{" "}
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPartylists.map((partylist) => {
                        const candidateCount = getCandidateCount(partylist);
                        return (
                            <Card
                                key={partylist.partylist_id}
                                className={`group border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                                    candidateCount === 0
                                        ? "bg-orange-50/30"
                                        : ""
                                }`}
                                onClick={() => viewPartylistDetails(partylist)}
                            >
                                <div
                                    className={`h-1.5 ${candidateCount > 0 ? "bg-blue-600" : "bg-orange-400"}`}
                                />
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                            {partylist.logo_url ? (
                                                <img
                                                    src={
                                                        getImageUrl(
                                                            partylist.logo_url,
                                                        ) || ""
                                                    }
                                                    alt={partylist.name}
                                                    className="w-14 h-14 rounded-xl object-cover border-2 border-gray-100"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display =
                                                            "none";
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                                                        candidateCount === 0
                                                            ? "bg-orange-500"
                                                            : "bg-blue-500"
                                                    }`}
                                                >
                                                    <Building2 className="w-7 h-7 text-white" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-lg truncate">
                                                    {partylist.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Users className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {candidateCount}{" "}
                                                        candidate
                                                        {candidateCount !== 1
                                                            ? "s"
                                                            : ""}
                                                    </span>
                                                </div>
                                                {partylist.creator && (
                                                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                                                        Created by:{" "}
                                                        {
                                                            partylist.creator
                                                                .first_name
                                                        }{" "}
                                                        {
                                                            partylist.creator
                                                                .last_name
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {partylist.description && (
                                        <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                                            {partylist.description}
                                        </p>
                                    )}
                                    {candidateCount === 0 && (
                                        <div className="mt-3 pt-3 border-t border-orange-200">
                                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                                No candidates assigned yet
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Info Section */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800">
                                About Partylists
                            </h4>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>
                                    • Partylists are organized by election year
                                </li>
                                <li>
                                    • Only the highest position candidate can
                                    create a partylist
                                </li>
                                <li>
                                    • Other candidates can join existing
                                    partylists
                                </li>
                                <li>
                                    • Click on a partylist to view its members
                                    and details
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PartylistList;