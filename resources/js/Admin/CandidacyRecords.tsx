// resources/js/pages/Admin/CandidacyRecords.tsx
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
import { Input } from "../components/ui/input";
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
import { Alert, AlertDescription } from "../components/ui/alert";
import { RefreshButton } from "../components/common/RefreshButton";
import { candidacyAPI, CandidacyApplication } from "../api/candidacy";
import { useElections } from "../hooks/useElections";
import {
    FileText,
    Search,
    Filter,
    Download,
    Eye,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    User,
    Users,
    Award,
    TrendingUp,
    FileSpreadsheet,
    FileJson,
    Printer,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Sparkles,
    BarChart3,
    PieChart as PieChartIcon,
    UserCheck,
    UserX,
    Hourglass,
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

type ViewMode = "list" | "grid";
type FilterStatus = "all" | "pending" | "approved" | "rejected";

interface ApplicationStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    by_election: Record<string, number>;
    by_course: Record<string, number>;
    by_position: Record<string, number>;
    daily_trend: Array<{ date: string; count: number }>;
}

const COLORS = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"];

const getStatusBadge = (status: string) => {
    const config: Record<
        string,
        { label: string; color: string; icon: React.ElementType }
    > = {
        pending: {
            label: "Pending",
            color: "bg-yellow-100 text-yellow-800",
            icon: Clock,
        },
        approved: {
            label: "Approved ✅",
            color: "bg-green-100 text-green-800",
            icon: CheckCircle,
        },
        rejected: {
            label: "Rejected",
            color: "bg-red-100 text-red-800",
            icon: XCircle,
        },
    };
    return config[status] || config.pending;
};

// ✅ Print Styles
const printStyles = `
@media print {
    /* Hide all UI elements */
    .no-print {
        display: none !important;
    }
    
    /* Show print area */
    .print-area {
        display: block !important;
        padding: 10mm !important;
    }
    
    /* Page settings */
    @page {
        margin: 10mm;
        size: A4 landscape;
    }
    
    /* Body reset */
    body {
        background: white !important;
        font-family: 'Times New Roman', Times, serif !important;
        font-size: 12px !important;
    }
    
    /* ===== PRINT HEADER ===== */
    .print-header {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        margin-bottom: 12px !important;
        padding-bottom: 10px !important;
        border-bottom: 2px solid #1a1a1a !important;
    }
    
    .print-header-logo {
        width: 40px !important;
        height: 40px !important;
        border-radius: 50% !important;
        overflow: hidden !important;
        border: 2px solid #1a1a1a !important;
        flex-shrink: 0 !important;
    }
    
    .print-header-logo img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
    }
    
    .print-header-text {
        flex: 1 !important;
    }
    
    .print-header-text h1 {
        font-size: 16px !important;
        font-weight: 700 !important;
        color: #1a1a1a !important;
        margin: 0 !important;
        letter-spacing: 0.5px !important;
    }
    
    .print-header-text .subtitle {
        font-size: 11px !important;
        color: #555 !important;
        margin: 2px 0 0 0 !important;
    }
    
    .print-header-text .meta {
        font-size: 9px !important;
        color: #888 !important;
        margin: 2px 0 0 0 !important;
    }
    
    /* ===== REPORT TITLE ===== */
    .print-report-title {
        text-align: center !important;
        margin-bottom: 12px !important;
    }
    
    .print-report-title h2 {
        font-size: 18px !important;
        font-weight: 700 !important;
        color: #1a1a1a !important;
        margin: 0 !important;
        letter-spacing: 1px !important;
    }
    
    .print-report-title .date {
        font-size: 10px !important;
        color: #888 !important;
        margin: 2px 0 0 0 !important;
    }
    
    /* ===== STATS ===== */
    .print-stats {
        display: flex !important;
        gap: 15px !important;
        margin: 10px 0 !important;
        padding: 8px !important;
        background: #f5f5f5 !important;
        border-radius: 4px !important;
        justify-content: center !important;
    }
    
    .print-stat-item {
        text-align: center !important;
    }
    
    .print-stat-item .label {
        font-size: 8px !important;
        color: #666 !important;
        text-transform: uppercase !important;
        font-weight: 600 !important;
    }
    
    .print-stat-item .value {
        font-size: 14px !important;
        font-weight: 700 !important;
        color: #1a1a1a !important;
    }
    
    /* ===== TABLE ===== */
    .print-table-container {
        margin: 8px 0 !important;
    }
    
    .print-table {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 9px !important;
    }
    
    .print-table th {
        background: #e8e8e8 !important;
        border: 1px solid #999 !important;
        padding: 4px 6px !important;
        text-align: left !important;
        font-weight: 700 !important;
        font-size: 8px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.3px !important;
    }
    
    .print-table td {
        border: 1px solid #ccc !important;
        padding: 3px 6px !important;
        font-size: 9px !important;
    }
    
    .print-table tr:nth-child(even) {
        background: #f9f9f9 !important;
    }
    
    .print-table .status-pending {
        color: #b45309 !important;
        font-weight: 600 !important;
    }
    .print-table .status-approved {
        color: #065f46 !important;
        font-weight: 600 !important;
    }
    .print-table .status-rejected {
        color: #991b1b !important;
        font-weight: 600 !important;
    }
    
    /* ===== FOOTER ===== */
    .print-footer {
        text-align: center !important;
        font-size: 7px !important;
        color: #999 !important;
        border-top: 1px solid #ddd !important;
        padding-top: 6px !important;
        margin-top: 10px !important;
    }
    
    /* Hide scrollbars */
    ::-webkit-scrollbar {
        display: none !important;
    }
    
    /* Page break */
    .print-page-break {
        page-break-before: always !important;
    }
}
`;

const CandidacyRecords: React.FC = () => {
    const navigate = useNavigate();
    const { data: elections = [], isLoading: electionsLoading } =
        useElections();
    const [applications, setApplications] = useState<CandidacyApplication[]>(
        [],
    );
    const [filteredApplications, setFilteredApplications] = useState<
        CandidacyApplication[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
    const [electionFilter, setElectionFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [selectedApplication, setSelectedApplication] =
        useState<CandidacyApplication | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [stats, setStats] = useState<ApplicationStats | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchApplications();
    }, [statusFilter, electionFilter]);

    useEffect(() => {
        filterApplications();
    }, [applications, searchTerm]);

    const fetchApplications = async () => {
        setLoading(true);
        setError("");
        try {
            const params: any = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (electionFilter !== "all")
                params.election_id = parseInt(electionFilter);

            console.log("📋 Fetching applications with params:", params);

            const response = await candidacyAPI.adminGetApplications(params);
            console.log("📋 Raw API Response:", response);

            let appsData: CandidacyApplication[] = [];

            // Case 1: response.data is the array directly
            if (Array.isArray(response.data)) {
                appsData = response.data;
            }
            // Case 2: response.data has a data property that is an array
            else if (response.data?.data && Array.isArray(response.data.data)) {
                appsData = response.data.data;
            }
            // Case 3: response.data has a data property with pagination
            else if (
                response.data?.data?.data &&
                Array.isArray(response.data.data.data)
            ) {
                appsData = response.data.data.data;
            }
            // Case 4: response.data has a data property with items
            else if (
                response.data?.data?.items &&
                Array.isArray(response.data.data.items)
            ) {
                appsData = response.data.data.items;
            }
            // Case 5: response.data has a success flag
            else if (
                response.data?.success &&
                response.data?.data &&
                Array.isArray(response.data.data)
            ) {
                appsData = response.data.data;
            }
            // Case 6: Fallback - try to find any array in the response
            else {
                for (const key in response.data) {
                    if (Array.isArray(response.data[key])) {
                        appsData = response.data[key];
                        break;
                    }
                }
            }

            console.log("✅ Extracted applications:", appsData);
            console.log("📊 Total applications:", appsData.length);

            setApplications(appsData);
            calculateStats(appsData);
        } catch (error: any) {
            console.error("❌ Failed to fetch applications:", error);
            setError(
                error.response?.data?.message || "Failed to load applications",
            );
            setApplications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (apps: CandidacyApplication[]) => {
        const stats: ApplicationStats = {
            total: apps.length,
            pending: apps.filter((a) => a.admin_status === "pending").length,
            approved: apps.filter((a) => a.admin_status === "approved").length,
            rejected: apps.filter((a) => a.admin_status === "rejected").length,
            by_election: {},
            by_course: {},
            by_position: {},
            daily_trend: [],
        };

        // Group by election
        apps.forEach((app) => {
            const electionTitle = app.election?.title || "Unknown Election";
            stats.by_election[electionTitle] =
                (stats.by_election[electionTitle] || 0) + 1;
        });

        // Group by course
        apps.forEach((app) => {
            const course = app.form_data?.course || "Unknown Course";
            stats.by_course[course] = (stats.by_course[course] || 0) + 1;
        });

        // Group by position
        apps.forEach((app) => {
            const position =
                app.form_data?.selectedPosition || "Unknown Position";
            stats.by_position[position] =
                (stats.by_position[position] || 0) + 1;
        });

        // Daily trend (last 7 days)
        const dateMap: Record<string, number> = {};
        apps.forEach((app) => {
            const date = new Date(app.created_at).toLocaleDateString();
            dateMap[date] = (dateMap[date] || 0) + 1;
        });
        stats.daily_trend = Object.entries(dateMap)
            .map(([date, count]) => ({ date, count }))
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            )
            .slice(-7);

        setStats(stats);
    };

    const filterApplications = () => {
        if (!searchTerm.trim()) {
            setFilteredApplications(applications);
            return;
        }
        const term = searchTerm.toLowerCase();
        const filtered = applications.filter(
            (app) =>
                app.user?.first_name?.toLowerCase().includes(term) ||
                app.user?.last_name?.toLowerCase().includes(term) ||
                app.user?.email?.toLowerCase().includes(term) ||
                app.user?.student_id?.toLowerCase().includes(term) ||
                app.form_data?.course?.toLowerCase().includes(term),
        );
        setFilteredApplications(filtered);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchApplications();
    };

    const handleViewDetail = (app: CandidacyApplication) => {
        setSelectedApplication(app);
        setDetailOpen(true);
    };

    const exportToCSV = () => {
        if (filteredApplications.length === 0) {
            alert("No data to export");
            return;
        }

        const headers = [
            "Application ID",
            "Name",
            "Student ID",
            "Email",
            "Course",
            "Position",
            "Organization",
            "Status",
            "Submitted Date",
            "Admin Remarks",
        ];

        const rows = filteredApplications.map((app) => [
            app.application_id,
            `${app.user?.first_name || ""} ${app.user?.last_name || ""}`,
            app.user?.student_id || "",
            app.user?.email || "",
            app.form_data?.course || "",
            app.form_data?.selectedPosition || "",
            app.form_data?.positionCSG
                ? "CSG"
                : app.form_data?.positionSC
                  ? "SC"
                  : "",
            app.admin_status,
            new Date(app.created_at).toLocaleDateString(),
            app.admin_remarks || "",
        ]);

        const csvContent = [headers, ...rows]
            .map((row) => row.join(","))
            .join("\n");
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `candidacy_records_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportToJSON = () => {
        if (filteredApplications.length === 0) {
            alert("No data to export");
            return;
        }

        const data = {
            exported_at: new Date().toISOString(),
            total: filteredApplications.length,
            applications: filteredApplications,
        };

        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `candidacy_records_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ✅ Print function - only prints important data
    const printRecords = () => {
        const printData = filteredApplications;
        
        if (printData.length === 0) {
            alert("No data to print");
            return;
        }

        const printWindow = window.open("", "_blank", "width=900,height=700");
        if (!printWindow) {
            alert("Please allow popups to print");
            return;
        }

        const now = new Date();
        const dateStr = now.toLocaleString();

        let tableRows = "";
        printData.forEach((app) => {
            const statusClass = app.admin_status === 'approved' ? 'status-approved' : 
                               app.admin_status === 'rejected' ? 'status-rejected' : 'status-pending';
            const statusLabel = app.admin_status.charAt(0).toUpperCase() + app.admin_status.slice(1);
            
            tableRows += `
                <tr>
                    <td>${app.application_id}</td>
                    <td>${app.user?.first_name || ''} ${app.user?.last_name || ''}</td>
                    <td>${app.user?.student_id || ''}</td>
                    <td>${app.user?.email || ''}</td>
                    <td>${app.form_data?.course || ''}</td>
                    <td>${app.form_data?.selectedPosition || ''}</td>
                    <td>${app.form_data?.positionCSG ? 'CSG' : app.form_data?.positionSC ? 'SC' : ''}</td>
                    <td class="${statusClass}">${statusLabel}</td>
                    <td>${new Date(app.created_at).toLocaleDateString()}</td>
                    <td>${app.admin_remarks || ''}</td>
                </tr>
            `;
        });

        const total = printData.length;
        const pending = printData.filter(a => a.admin_status === 'pending').length;
        const approved = printData.filter(a => a.admin_status === 'approved').length;
        const rejected = printData.filter(a => a.admin_status === 'rejected').length;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Candidacy Records Report</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Times New Roman', Times, serif; 
                    background: white; 
                    padding: 8mm; 
                    color: #1a1a1a; 
                    line-height: 1.4;
                }
                ${printStyles}
                
                @media print {
                    body { padding: 0 !important; margin: 0 !important; }
                    .print-header { margin-bottom: 10px !important; padding-bottom: 8px !important; }
                    .print-report-title { margin-bottom: 10px !important; }
                    .print-stats { padding: 6px !important; margin: 8px 0 !important; }
                    .print-table th { padding: 3px 5px !important; }
                    .print-table td { padding: 2px 5px !important; }
                }
                
                .print-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #1a1a1a;
                }
                .print-header-logo {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 2px solid #1a1a1a;
                    flex-shrink: 0;
                }
                .print-header-logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .print-header-text h1 {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin: 0;
                }
                .print-header-text .subtitle {
                    font-size: 11px;
                    color: #555;
                }
                .print-header-text .meta {
                    font-size: 9px;
                    color: #888;
                }
                .print-report-title {
                    text-align: center;
                    margin-bottom: 12px;
                }
                .print-report-title h2 {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin: 0;
                }
                .print-report-title .date {
                    font-size: 10px;
                    color: #888;
                }
                .print-stats {
                    display: flex;
                    gap: 15px;
                    margin: 10px 0;
                    padding: 8px;
                    background: #f5f5f5;
                    border-radius: 4px;
                    justify-content: center;
                }
                .print-stat-item {
                    text-align: center;
                }
                .print-stat-item .label {
                    font-size: 8px;
                    color: #666;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                .print-stat-item .value {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1a1a1a;
                }
                .print-table-container {
                    margin: 8px 0;
                }
                .print-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 9px;
                }
                .print-table th {
                    background: #e8e8e8;
                    border: 1px solid #999;
                    padding: 4px 6px;
                    text-align: left;
                    font-weight: 700;
                    font-size: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .print-table td {
                    border: 1px solid #ccc;
                    padding: 3px 6px;
                    font-size: 9px;
                }
                .print-table tr:nth-child(even) {
                    background: #f9f9f9;
                }
                .print-table .status-pending {
                    color: #b45309;
                    font-weight: 600;
                }
                .print-table .status-approved {
                    color: #065f46;
                    font-weight: 600;
                }
                .print-table .status-rejected {
                    color: #991b1b;
                    font-weight: 600;
                }
                .print-footer {
                    text-align: center;
                    font-size: 7px;
                    color: #999;
                    border-top: 1px solid #ddd;
                    padding-top: 6px;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="print-area">
                <!-- Print Header -->
                <div class="print-header">
                    <div class="print-header-logo">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231a56db' width='100' height='100'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='28' font-weight='bold' fill='white' text-anchor='middle'%3EOCC%3C/text%3E%3C/svg%3E" alt="OCC Logo" />
                    </div>
                    <div class="print-header-text">
                        <h1>Opol Community College</h1>
                        <div class="subtitle">Election System - Candidacy Records</div>
                        <div class="meta">Generated: ${dateStr}</div>
                    </div>
                </div>

                <!-- Report Title -->
                <div class="print-report-title">
                    <h2>CANDIDACY RECORDS REPORT</h2>
                    <div class="date">${dateStr}</div>
                </div>

                <!-- Stats -->
                <div class="print-stats">
                    <div class="print-stat-item">
                        <div class="label">Total Applications</div>
                        <div class="value">${total}</div>
                    </div>
                    <div class="print-stat-item">
                        <div class="label">Pending</div>
                        <div class="value">${pending}</div>
                    </div>
                    <div class="print-stat-item">
                        <div class="label">Approved</div>
                        <div class="value">${approved}</div>
                    </div>
                    <div class="print-stat-item">
                        <div class="label">Rejected</div>
                        <div class="value">${rejected}</div>
                    </div>
                    <div class="print-stat-item">
                        <div class="label">Approval Rate</div>
                        <div class="value">${total > 0 ? Math.round((approved / total) * 100) : 0}%</div>
                    </div>
                </div>

                <!-- Table -->
                <div class="print-table-container">
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Student ID</th>
                                <th>Email</th>
                                <th>Course</th>
                                <th>Position</th>
                                <th>Organization</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>

                <!-- Footer -->
                <div class="print-footer">
                    This is a system-generated candidacy records report from the OCC Election System.<br>
                    © ${new Date().getFullYear()} Opol Community College. All rights reserved.
                </div>
            </div>

            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                    
                    window.onafterprint = function() {
                        window.close();
                    };
                    
                    setTimeout(function() {
                        window.close();
                    }, 60000);
                };
            </script>
        </body>
        </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // Pagination
    const totalPages = Math.ceil(filteredApplications.length / perPage);
    const paginatedApps = filteredApplications.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage,
    );

    // Pie chart data
    const pieData = stats
        ? [
              { name: "Pending", value: stats.pending, color: "#f59e0b" },
              { name: "Approved", value: stats.approved, color: "#10b981" },
              { name: "Rejected", value: stats.rejected, color: "#ef4444" },
          ]
        : [];

    // Bar chart data
    const barData = stats
        ? Object.entries(stats.by_election)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10)
        : [];

    if (loading && !applications.length) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Print Styles */}
            <style>{printStyles}</style>

            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Candidacy Records
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                Candidacy Records
                            </h1>
                            <p className="text-blue-100 mt-1">
                                Track and manage all candidacy applications
                            </p>
                        </div>
                        <div className="flex items-center gap-2 no-print">
                            <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                                <FileText className="w-4 h-4 mr-1" />
                                {stats?.total || 0} Total Applications
                            </Badge>
                            <RefreshButton
                                onClick={handleRefresh}
                                isLoading={refreshing}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats - Pill/Badge Style */}
            {stats && (
                <div className="flex flex-wrap items-center gap-3 py-1 no-print">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">
                            Total
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                            {stats.total}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                        <Hourglass className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">
                            Pending
                        </span>
                        <span className="text-sm font-bold text-yellow-800">
                            {stats.pending}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                        <UserCheck className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            Approved
                        </span>
                        <span className="text-sm font-bold text-green-800">
                            {stats.approved}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                        <UserX className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                            Rejected
                        </span>
                        <span className="text-sm font-bold text-red-800">
                            {stats.rejected}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">
                            Approval Rate
                        </span>
                        <span className="text-sm font-bold text-purple-800">
                            {stats.total > 0
                                ? Math.round(
                                      (stats.approved / stats.total) * 100,
                                  )
                                : 0}
                            %
                        </span>
                    </div>
                </div>
            )}

            {error && (
                <Alert variant="destructive" className="rounded-xl no-print">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Filters & Search */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden no-print">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        Filters & Search
                    </CardTitle>
                </div>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search by name, email, student ID..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10 rounded-xl bg-gray-50 border-gray-200"
                            />
                        </div>
                        <div>
                            <Select
                                value={statusFilter}
                                onValueChange={(value: FilterStatus) => {
                                    setStatusFilter(value);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="rounded-xl bg-gray-50 border-gray-200">
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Status
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="approved">
                                        Approved
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                        Rejected
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Select
                                value={electionFilter}
                                onValueChange={(value) => {
                                    setElectionFilter(value);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="rounded-xl bg-gray-50 border-gray-200">
                                    <SelectValue placeholder="Filter by Election" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Elections
                                    </SelectItem>
                                    {elections.map((e: any) => (
                                        <SelectItem
                                            key={e.election_id}
                                            value={e.election_id.toString()}
                                        >
                                            {e.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                Showing {filteredApplications.length} of{" "}
                                {applications.length} applications
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportToCSV}
                                className="rounded-xl"
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                CSV
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportToJSON}
                                className="rounded-xl"
                            >
                                <FileJson className="w-4 h-4 mr-2" />
                                JSON
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={printRecords}
                                className="rounded-xl"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                        viewMode === "list"
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                    }`}
                                    onClick={() => setViewMode("list")}
                                >
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
                                    Grid
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Charts Section - No Print */}
            {stats && stats.total > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-blue-600" />
                                Application Status Distribution
                            </CardTitle>
                        </div>
                        <CardContent className="p-6">
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
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
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                Applications by Election
                            </CardTitle>
                        </div>
                        <CardContent className="p-6">
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={barData}
                                        layout="vertical"
                                        margin={{ left: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={100}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"
                                            fill="#3b82f6"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Applications Table */}
            {filteredApplications.length === 0 ? (
                <Card className="rounded-xl border-0 shadow-lg no-print">
                    <CardContent className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No Applications Found
                        </h3>
                        <p className="text-gray-500">
                            {applications.length === 0
                                ? "No candidacy applications submitted yet"
                                : searchTerm
                                  ? `No applications matching "${searchTerm}"`
                                  : "No applications found for the selected filters"}
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === "list" ? (
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden no-print">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Applicant
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Position
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Course
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Election
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Status
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Submitted
                                        </th>
                                        <th className="text-right p-4 text-sm font-semibold text-gray-700">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedApps.map((app) => {
                                        const status = getStatusBadge(
                                            app.admin_status,
                                        );
                                        const StatusIcon = status.icon;
                                        return (
                                            <tr
                                                key={app.application_id}
                                                className="hover:bg-blue-50/30 transition-colors"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                                                            {
                                                                app.user
                                                                    ?.first_name?.[0]
                                                            }
                                                            {
                                                                app.user
                                                                    ?.last_name?.[0]
                                                            }
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">
                                                                {
                                                                    app.user
                                                                        ?.first_name
                                                                }{" "}
                                                                {
                                                                    app.user
                                                                        ?.last_name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {
                                                                    app.user
                                                                        ?.student_id
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {app.form_data
                                                            ?.selectedPosition ||
                                                            "N/A"}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-gray-600">
                                                        {app.form_data
                                                            ?.course || "N/A"}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-gray-600">
                                                        {app.election?.title ||
                                                            "N/A"}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <Badge
                                                        className={status.color}
                                                    >
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {status.label}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(
                                                            app.created_at,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleViewDetail(
                                                                app,
                                                            )
                                                        }
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 no-print">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className="rounded-xl"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-500">
                                    Page {currentPage} of {totalPages} (
                                    {filteredApplications.length} applications)
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
                                    className="rounded-xl"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
                    {paginatedApps.map((app) => {
                        const status = getStatusBadge(app.admin_status);
                        const StatusIcon = status.icon;
                        return (
                            <Card
                                key={app.application_id}
                                className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div
                                    className={`h-1.5 ${
                                        app.admin_status === "approved"
                                            ? "bg-green-500"
                                            : app.admin_status === "rejected"
                                              ? "bg-red-500"
                                              : "bg-yellow-500"
                                    }`}
                                />
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gblue-500 text-white flex items-center justify-center font-bold text-sm">
                                                {app.user?.first_name?.[0]}
                                                {app.user?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {app.user?.first_name}{" "}
                                                    {app.user?.last_name}
                                                </h3>
                                                <p className="text-xs text-gray-400">
                                                    {app.user?.student_id}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={status.color}>
                                            <StatusIcon className="w-3 h-3 mr-1" />
                                            {status.label}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 space-y-1 text-sm">
                                        <p className="text-gray-600">
                                            <span className="font-medium">
                                                Position:
                                            </span>{" "}
                                            {app.form_data?.selectedPosition ||
                                                "N/A"}
                                        </p>
                                        <p className="text-gray-600">
                                            <span className="font-medium">
                                                Course:
                                            </span>{" "}
                                            {app.form_data?.course || "N/A"}
                                        </p>
                                        <p className="text-gray-600">
                                            <span className="font-medium">
                                                Election:
                                            </span>{" "}
                                            {app.election?.title || "N/A"}
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            Submitted:{" "}
                                            {new Date(
                                                app.created_at,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleViewDetail(app)
                                            }
                                            className="rounded-xl"
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            View Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Application Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedApplication && (
                        <div className="space-y-4">
                            {/* Applicant Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Name
                                    </p>
                                    <p className="font-semibold">
                                        {selectedApplication.user?.first_name}{" "}
                                        {selectedApplication.user?.last_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Student ID
                                    </p>
                                    <p className="font-semibold">
                                        {selectedApplication.user?.student_id}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Email
                                    </p>
                                    <p className="font-semibold">
                                        {selectedApplication.user?.email}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Status
                                    </p>
                                    <Badge
                                        className={
                                            getStatusBadge(
                                                selectedApplication.admin_status,
                                            ).color
                                        }
                                    >
                                        {
                                            getStatusBadge(
                                                selectedApplication.admin_status,
                                            ).label
                                        }
                                    </Badge>
                                </div>
                            </div>

                            {/* Application Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Course
                                    </p>
                                    <p className="font-semibold">
                                        {selectedApplication.form_data
                                            ?.course || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Position
                                    </p>
                                    <p className="font-semibold">
                                        {selectedApplication.form_data
                                            ?.selectedPosition || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Organization
                                    </p>
                                    <p className="font-semibold">
                                        {selectedApplication.form_data
                                            ?.positionCSG
                                            ? "CSG"
                                            : selectedApplication.form_data
                                                    ?.positionSC
                                              ? "SC"
                                              : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Election
                                    </p>
                                    <p className="font-semibold">
                                        {selectedApplication.election?.title ||
                                            "N/A"}
                                    </p>
                                </div>
                            </div>

                            {/* Platform & Qualifications */}
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-gray-700">
                                    Campaign Platform
                                </p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                                    {selectedApplication.form_data?.platform ||
                                        "Not provided"}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-gray-700">
                                    Qualifications
                                </p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                                    {selectedApplication.form_data
                                        ?.qualifications || "Not provided"}
                                </p>
                            </div>

                            {/* Admin Remarks */}
                            {selectedApplication.admin_remarks && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-gray-700">
                                        Admin Remarks
                                    </p>
                                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                                        {selectedApplication.admin_remarks}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setDetailOpen(false)}
                                    className="rounded-xl"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Info Section */}
            <Card className="bg-blue-50 border-blue-200 no-print">
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800">
                                About Candidacy Records
                            </h4>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>
                                    • Track all candidacy applications submitted
                                    by students
                                </li>
                                <li>
                                    • Filter and search applications by status,
                                    election, or applicant
                                </li>
                                <li>
                                    • Export data to CSV or JSON for reporting
                                    purposes
                                </li>
                                <li>
                                    • View detailed application information
                                    including platform and qualifications
                                </li>
                                <li>
                                    • Monitor application trends and status
                                    distribution
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CandidacyRecords;