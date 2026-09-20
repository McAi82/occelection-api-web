// js/Monitoring/MonitoringTurnout.tsx
import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { monitoringAPI } from "../api/monitoring";
import { electionAPI } from "../api/elections";
import type { Election as ApiElection } from "../types";
import {
    Users,
    Vote,
    RefreshCw,
    Loader2,
    TrendingUp,
    Clock,
    PieChart as PieChartIcon,
    BarChart3,
    AlertCircle,
    Sparkles,
    Target,
    Calendar,
    Download,
} from "lucide-react";
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

// ✅ Use imported type
// No local Election interface needed

interface BreakdownItem {
    course?: { course_code: string; course_name: string } | string;
    year_level?: number;
    voted: number;
    total: number;
    percentage?: number;
}

interface TurnoutData {
    total_voters: number;
    voted_count: number;
    turnout_percentage: number;
    remaining_voters: number;
    breakdown: {
        by_course: BreakdownItem[];
        by_year: BreakdownItem[];
    };
}


// ✅ FIX: Proper label renderer for PieChart
const renderCustomizedLabel = (props: any): string => {
    const { name, percent } = props;
    if (!name) return "";
    const percentage = ((percent || 0) * 100).toFixed(0);
    return `${name}: ${percentage}%`;
};

const MonitoringTurnout: React.FC = () => {
    const [elections, setElections] = useState<ApiElection[]>([]);
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [turnoutData, setTurnoutData] = useState<TurnoutData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        fetchElections();
    }, []);

    useEffect(() => {
        if (selectedElection) {
            fetchTurnoutData();
            const interval = setInterval(() => {
                fetchTurnoutData();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [selectedElection]);

    const fetchElections = async (): Promise<void> => {
        try {
            const response = await electionAPI.getAll();
            // ✅ FIX: response.data is the direct array
            const electionsData = response.data;
            setElections(Array.isArray(electionsData) ? electionsData : []);
            if (electionsData && electionsData.length > 0) {
                setSelectedElection(electionsData[0].election_id.toString());
            }
        } catch (error) {
            console.error("Failed to fetch elections:", error);
            setError("Failed to load elections");
        } finally {
            setLoading(false);
        }
    };

    const fetchTurnoutData = async (): Promise<void> => {
        if (!selectedElection) return;
        try {
            const response = await monitoringAPI.getTurnout(selectedElection);
            // ✅ FIX: response.data is the turnout data directly (no nested data property)
            const data = response.data;

            if (data) {
                const transformedData: TurnoutData = {
                    total_voters: data.total_voters || 0,
                    voted_count: data.voted_count || 0,
                    turnout_percentage: data.turnout_percentage || 0,
                    remaining_voters: data.remaining_voters || 0,
                    breakdown: {
                        by_course: data.breakdown?.by_course || [],
                        by_year: data.breakdown?.by_year || [],
                    },
                };
                setTurnoutData(transformedData);
            } else {
                setTurnoutData(null);
            }
            setLastRefresh(new Date());
            setError("");
        } catch (error: any) {
            console.error("Failed to fetch turnout data:", error);
            setError(
                error.response?.data?.message || "Failed to load turnout data",
            );
        }
    };

    const refreshData = async (): Promise<void> => {
        setRefreshing(true);
        await fetchTurnoutData();
        setRefreshing(false);
    };

    const exportToCSV = (): void => {
        if (!turnoutData) return;
        const headers = ["Category", "Voted", "Total", "Percentage"];
        const rows: string[][] = [];

        if (turnoutData.breakdown?.by_course) {
            turnoutData.breakdown.by_course.forEach((item) => {
                const courseName =
                    typeof item.course === "object"
                        ? item.course?.course_code
                        : item.course || "No Course";
                const percentage =
                    item.total > 0
                        ? Math.round((item.voted / item.total) * 100)
                        : 0;
                rows.push([
                    `Course: ${courseName}`,
                    item.voted.toString(),
                    item.total.toString(),
                    `${percentage}%`,
                ]);
            });
        }
        if (turnoutData.breakdown?.by_year) {
            turnoutData.breakdown.by_year.forEach((item) => {
                const percentage =
                    item.total > 0
                        ? Math.round((item.voted / item.total) * 100)
                        : 0;
                rows.push([
                    `Year ${item.year_level}`,
                    item.voted.toString(),
                    item.total.toString(),
                    `${percentage}%`,
                ]);
            });
        }

        const csvContent = [headers, ...rows]
            .map((row) => row.join(","))
            .join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `turnout_data_${selectedElection}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const preparePieChartData = (): Array<{
        name: string;
        value: number;
        color: string;
    }> => {
        if (!turnoutData) return [];
        const voted = turnoutData.voted_count || 0;
        const notVoted = (turnoutData.total_voters || 0) - voted;
        return [
            { name: "Voted", value: voted, color: "#10b981" },
            { name: "Not Voted", value: notVoted, color: "#ef4444" },
        ];
    };

    const prepareCourseChartData = (): Array<{
        course: string;
        voted: number;
        total: number;
        percentage: number;
    }> => {
        if (!turnoutData?.breakdown?.by_course) return [];
        return turnoutData.breakdown.by_course.map((item) => {
            const courseName =
                typeof item.course === "object"
                    ? item.course?.course_code
                    : item.course || "No Course";
            return {
                course: courseName,
                voted: item.voted || 0,
                total: item.total || 0,
                percentage:
                    item.total > 0
                        ? Math.round((item.voted / item.total) * 100)
                        : 0,
            };
        });
    };

    const prepareYearChartData = (): Array<{
        year: string;
        voted: number;
        total: number;
        percentage: number;
    }> => {
        if (!turnoutData?.breakdown?.by_year) return [];
        return turnoutData.breakdown.by_year.map((item) => ({
            year: `Year ${item.year_level}`,
            voted: item.voted || 0,
            total: item.total || 0,
            percentage:
                item.total > 0
                    ? Math.round((item.voted / item.total) * 100)
                    : 0,
        }));
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
                        Loading turnout analytics...
                    </p>
                </div>
            </div>
        );
    }

    const totalVoters = turnoutData?.total_voters || 0;
    const votedCount = turnoutData?.voted_count || 0;
    const turnoutPercentage = turnoutData?.turnout_percentage || 0;
    const pieData = preparePieChartData();
    const courseChartData = prepareCourseChartData();
    const yearChartData = prepareYearChartData();

    const selectedElectionTitle =
        elections.find((e) => e.election_id.toString() === selectedElection)
            ?.title || "";

    return (
        <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 via-indigo-600 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Turnout Analytics
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                Voter Turnout Analytics
                            </h1>
                            <p className="text-blue-100 mt-1">
                                Detailed voter participation statistics and
                                trends
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refreshData}
                                disabled={refreshing}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                                />
                                Refresh
                            </Button>
                            <Button
                                size="sm"
                                onClick={exportToCSV}
                                className="bg-white text-blue-600 hover:bg-gray-100"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Select Election
                    </CardTitle>
                </div>
                <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <select
                            className="px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 min-w-[250px]"
                            value={selectedElection}
                            onChange={(e) =>
                                setSelectedElection(e.target.value)
                            }
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
                        <div className="text-sm text-gray-500">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Analyzing turnout for: {selectedElectionTitle}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-red-200 bg-red-50 rounded-xl">
                    <CardContent className="p-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-600">{error}</span>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-blue-600 text-white rounded-xl shadow-xl overflow-hidden">
                <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">Current Turnout Rate</span>
                    </div>
                    <h2 className="text-6xl font-bold mb-2">
                        {turnoutPercentage}%
                    </h2>
                    <p className="text-blue-100 mb-6">Voter Turnout Rate</p>
                    <div className="w-full bg-white/20 rounded-full h-4 mb-6">
                        <div
                            className="bg-green-400 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${turnoutPercentage}%` }}
                        />
                    </div>
                    <div className="flex justify-center gap-8 text-sm">
                        <div className="text-center">
                            <div className="text-2xl font-bold">
                                {votedCount}
                            </div>
                            <div className="text-blue-100">Voted</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">
                                {totalVoters - votedCount}
                            </div>
                            <div className="text-blue-100">Remaining</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">
                                {totalVoters}
                            </div>
                            <div className="text-blue-100">Total Voters</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-blue-600" />
                            Participation Distribution
                        </CardTitle>
                    </div>
                    <CardContent className="p-6">
                        {pieData.length > 0 && pieData[0].value > 0 ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={renderCustomizedLabel}
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
                            <div className="h-[300px] flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <Vote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No voting data available</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-green-600" />
                            Turnout by Course
                        </CardTitle>
                    </div>
                    <CardContent className="p-6">
                        {courseChartData.length > 0 ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={courseChartData}
                                        layout="vertical"
                                        margin={{ left: 80 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis
                                            dataKey="course"
                                            type="category"
                                        />
                                        <Tooltip />
                                        <Legend />
                                        <Bar
                                            dataKey="voted"
                                            fill="#3b82f6"
                                            name="Voted"
                                            radius={[0, 8, 8, 0]}
                                        />
                                        <Bar
                                            dataKey="total"
                                            fill="#10b981"
                                            name="Total Voters"
                                            radius={[0, 8, 8, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500">
                                <p>No course data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {yearChartData.length > 0 && (
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-orange-600" />
                            Turnout by Year Level
                        </CardTitle>
                    </div>
                    <CardContent className="p-6">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yearChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="year" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="voted"
                                        fill="#3b82f6"
                                        name="Voted"
                                        radius={[8, 8, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="total"
                                        fill="#10b981"
                                        name="Total Voters"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courseChartData.length > 0 && (
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                Course Breakdown
                            </CardTitle>
                        </div>
                        <CardContent className="p-5">
                            <div className="space-y-4">
                                {courseChartData.map((course, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-gray-700">
                                                {course.course}
                                            </span>
                                            <span className="text-gray-500">
                                                {course.percentage}% (
                                                {course.voted}/{course.total})
                                            </span>
                                        </div>
                                        <Progress
                                            value={course.percentage}
                                            className="h-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {yearChartData.length > 0 && (
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                Year Level Breakdown
                            </CardTitle>
                        </div>
                        <CardContent className="p-5">
                            <div className="space-y-4">
                                {yearChartData.map((year, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-gray-700">
                                                {year.year}
                                            </span>
                                            <span className="text-gray-500">
                                                {year.percentage}% ({year.voted}
                                                /{year.total})
                                            </span>
                                        </div>
                                        <Progress
                                            value={year.percentage}
                                            className="h-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="text-center text-sm text-gray-400">
                <Clock className="w-4 h-4 inline mr-1" />
                Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
        </div>
    );
};

export default MonitoringTurnout;
