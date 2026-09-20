// resources/js/pages/Admin/Reports.tsx
import React, { useState, useEffect, useRef } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { adminAPI } from "../api/admin";
import { electionAPI } from "../api/elections";
import { useElections } from "../hooks/useElections";
import { RefreshButton } from "../components/common/RefreshButton";
import {
    Download,
    FileText,
    Users,
    Vote,
    TrendingUp,
    BarChart3,
    PieChart as PieChartIcon,
    Award,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Printer,
    AlertCircle,
    FileJson,
    FileSpreadsheet,
    File,
    Eye,
    ChevronDown,
    ChevronUp,
    School,
    GraduationCap,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Election {
    election_id: number;
    title: string;
    election_type: string;
    voting_start: string;
    voting_end: string;
}

interface TurnoutReport {
    total_voters: number;
    voted_count: number;
    turnout_percentage: number;
    remaining_voters: number;
    breakdown_by_course: Array<{
        course: string;
        total: number;
        voted: number;
    }>;
    last_updated: string;
}

interface SanctionsList {
    total_eligible_voters: number;
    total_non_voters: number;
    non_voters_list: Array<{
        student_id: string;
        first_name: string;
        last_name: string;
        email: string;
        course: string;
        year_level: number;
    }>;
}

interface Results {
    election: Election;
    results: Record<
        string,
        Array<{
            candidate: {
                candidate_id: number;
                user?: { first_name: string; last_name: string };
                partylist?: { name: string };
            };
            votes: number;
        }>
    >;
}

const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
];

// ✅ Enhanced Print Styles - Clean and Professional
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
        margin: 12mm;
        size: A4 portrait;
    }
    
    /* Body reset */
    body {
        background: white !important;
        font-family: 'Times New Roman', Times, serif !important;
    }
    
    /* ===== PRINT HEADER ===== */
    .print-header {
        display: flex !important;
        align-items: center !important;
        gap: 14px !important;
        margin-bottom: 14px !important;
        padding-bottom: 12px !important;
        border-bottom: 3px solid #1a1a1a !important;
    }
    
    .print-header-logo {
        width: 50px !important;
        height: 50px !important;
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
        font-size: 18px !important;
        font-weight: 700 !important;
        color: #1a1a1a !important;
        margin: 0 !important;
        letter-spacing: 0.5px !important;
    }
    
    .print-header-text .subtitle {
        font-size: 12px !important;
        color: #555 !important;
        margin: 2px 0 0 0 !important;
    }
    
    .print-header-text .meta {
        font-size: 10px !important;
        color: #888 !important;
        margin: 4px 0 0 0 !important;
    }
    
    /* ===== REPORT TITLE ===== */
    .print-report-title {
        text-align: center !important;
        margin-bottom: 16px !important;
    }
    
    .print-report-title h2 {
        font-size: 22px !important;
        font-weight: 700 !important;
        color: #1a1a1a !important;
        margin: 0 !important;
        letter-spacing: 1px !important;
    }
    
    .print-report-title .election-name {
        font-size: 14px !important;
        color: #444 !important;
        margin: 4px 0 0 0 !important;
    }
    
    .print-report-title .date-range {
        font-size: 11px !important;
        color: #888 !important;
        margin: 2px 0 0 0 !important;
    }
    
    /* ===== STATS CARDS ===== */
    .print-stats-grid {
        display: grid !important;
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 10px !important;
        margin: 14px 0 !important;
    }
    
    .print-stat-card {
        border: 1px solid #ddd !important;
        border-radius: 6px !important;
        padding: 10px !important;
        text-align: center !important;
        background: #fafafa !important;
    }
    
    .print-stat-card .label {
        font-size: 9px !important;
        color: #666 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        font-weight: 600 !important;
    }
    
    .print-stat-card .value {
        font-size: 22px !important;
        font-weight: 700 !important;
        color: #1a1a1a !important;
        margin-top: 2px !important;
    }
    
    .print-stat-card .value.green { color: #0d7c3f !important; }
    .print-stat-card .value.blue { color: #1a56db !important; }
    .print-stat-card .value.orange { color: #b45309 !important; }
    .print-stat-card .value.purple { color: #6b21a5 !important; }
    .print-stat-card .value.red { color: #b91c1c !important; }
    
    /* ===== SECTION TITLE ===== */
    .print-section-title {
        font-size: 14px !important;
        font-weight: 700 !important;
        color: #1a1a1a !important;
        margin: 16px 0 8px 0 !important;
        padding-bottom: 4px !important;
        border-bottom: 2px solid #1a1a1a !important;
    }
    
    .print-sub-section-title {
        font-size: 12px !important;
        font-weight: 600 !important;
        color: #333 !important;
        margin: 12px 0 6px 0 !important;
    }
    
    /* ===== TABLE STYLES ===== */
    .print-table-container {
        margin: 8px 0 12px 0 !important;
    }
    
    .print-table {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 10px !important;
    }
    
    .print-table th {
        background: #f0f0f0 !important;
        border: 1px solid #ccc !important;
        padding: 6px 8px !important;
        text-align: left !important;
        font-weight: 700 !important;
        font-size: 9px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.3px !important;
    }
    
    .print-table td {
        border: 1px solid #ccc !important;
        padding: 5px 8px !important;
        font-size: 10px !important;
    }
    
    .print-table tr:nth-child(even) {
        background: #f9f9f9 !important;
    }
    
    .print-table .total-row {
        background: #e8e8e8 !important;
        font-weight: 700 !important;
    }
    
    /* ===== WINNER BADGE ===== */
    .print-winner-badge {
        display: inline-block !important;
        background: #d1fae5 !important;
        color: #065f46 !important;
        padding: 1px 10px !important;
        border-radius: 9999px !important;
        font-size: 8px !important;
        font-weight: 700 !important;
        letter-spacing: 0.3px !important;
    }
    
    .print-status-badge {
        display: inline-block !important;
        padding: 1px 10px !important;
        border-radius: 9999px !important;
        font-size: 8px !important;
        font-weight: 700 !important;
    }
    .print-status-badge.success { background: #d1fae5 !important; color: #065f46 !important; }
    .print-status-badge.warning { background: #fef3c7 !important; color: #92400e !important; }
    .print-status-badge.danger { background: #fee2e2 !important; color: #991b1b !important; }
    .print-status-badge.info { background: #dbeafe !important; color: #1e40af !important; }
    
    /* ===== PROGRESS BAR ===== */
    .print-progress-bar {
        width: 100% !important;
        height: 6px !important;
        background: #e5e7eb !important;
        border-radius: 999px !important;
        overflow: hidden !important;
        margin-top: 2px !important;
    }
    
    .print-progress-bar .fill {
        height: 100% !important;
        border-radius: 999px !important;
    }
    .print-progress-bar .fill.blue { background: #3b82f6 !important; }
    .print-progress-bar .fill.green { background: #10b981 !important; }
    
    /* ===== RESULTS TABLE ===== */
    .print-results-table td:last-child {
        text-align: center !important;
    }
    
    /* ===== FOOTER ===== */
    .print-footer {
        text-align: center !important;
        font-size: 8px !important;
        color: #999 !important;
        border-top: 1px solid #ddd !important;
        padding-top: 8px !important;
        margin-top: 16px !important;
    }
    
    /* ===== PAGE BREAK ===== */
    .print-page-break {
        page-break-before: always !important;
    }
    
    /* ===== HIDE CHART TOOLTIPS ===== */
    .recharts-tooltip-wrapper {
        display: none !important;
    }
    
    /* ===== CHART CONTAINERS ===== */
    .print-chart-container {
        width: 100% !important;
        height: 180px !important;
        margin: 6px 0 !important;
    }
    
    /* ===== RESPONSIVE GRID FOR CHARTS ===== */
    .print-chart-grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 16px !important;
        margin: 10px 0 !important;
    }
}
`;

const Reports: React.FC = () => {
    const {
        data: elections = [],
        isLoading: electionsLoading,
        refetch: refetchElections,
    } = useElections();
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [turnoutReport, setTurnoutReport] = useState<TurnoutReport | null>(
        null,
    );
    const [sanctionsList, setSanctionsList] = useState<SanctionsList | null>(
        null,
    );
    const [results, setResults] = useState<Results | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState("turnout");
    const [error, setError] = useState("");
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (elections.length > 0 && !selectedElection) {
            setSelectedElection(elections[0].election_id.toString());
        }
    }, [elections]);

    useEffect(() => {
        if (selectedElection) {
            fetchReports();
        }
    }, [selectedElection]);

    const fetchReports = async (): Promise<void> => {
        if (!selectedElection) return;
        setLoading(true);
        setError("");
        try {
            try {
                const turnoutRes =
                    await adminAPI.getTurnoutReport(selectedElection);
                let turnoutData = turnoutRes.data;
                if (turnoutData?.data) turnoutData = turnoutData.data;
                setTurnoutReport(turnoutData || null);
            } catch (err) {
                console.error("Failed to fetch turnout:", err);
                setTurnoutReport(null);
            }

            try {
                const sanctionsRes =
                    await adminAPI.getSanctionsList(selectedElection);
                let sanctionsData = sanctionsRes.data;
                if (sanctionsData?.data) sanctionsData = sanctionsData.data;
                setSanctionsList(sanctionsData || null);
            } catch (err) {
                console.error("Failed to fetch sanctions:", err);
                setSanctionsList(null);
            }

            try {
                const resultsRes =
                    await electionAPI.getResults(selectedElection);
                let resultsData = resultsRes.data;
                if (resultsData?.data) resultsData = resultsData.data;
                if (resultsData && typeof resultsData === "object") {
                    setResults(resultsData as Results);
                } else {
                    setResults(null);
                }
            } catch (err) {
                console.error("Failed to fetch results:", err);
                setResults(null);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
            setError("Failed to load reports data");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async (): Promise<void> => {
        await fetchReports();
        await refetchElections();
    };

    // ✅ Enhanced Print Function
    const handlePrint = () => {
        // Save the current tab to print
        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (!printWindow) {
            alert("Please allow popups to print the report");
            return;
        }

        const election = elections.find(
            (e: any) => e.election_id?.toString() === selectedElection,
        );
        const electionTitle = election?.title || "Election Report";
        const electionType = election?.election_type || "";
        const startDate = election?.voting_start
            ? new Date(election.voting_start).toLocaleDateString()
            : "";
        const endDate = election?.voting_end
            ? new Date(election.voting_end).toLocaleDateString()
            : "";

        // Build print content based on active tab
        let content = "";

        // ===== TURNOUT CONTENT =====
        if (activeTab === "turnout" && turnoutReport) {
            const pieData = [
                {
                    name: "Voted",
                    value: turnoutReport.voted_count || 0,
                    color: "#10b981",
                },
                {
                    name: "Not Voted",
                    value:
                        (turnoutReport.total_voters || 0) -
                        (turnoutReport.voted_count || 0),
                    color: "#ef4444",
                },
            ];

            content = `
                <div class="print-stats-grid">
                    <div class="print-stat-card">
                        <div class="label">Total Voters</div>
                        <div class="value blue">${turnoutReport.total_voters || 0}</div>
                    </div>
                    <div class="print-stat-card">
                        <div class="label">Votes Cast</div>
                        <div class="value green">${turnoutReport.voted_count || 0}</div>
                    </div>
                    <div class="print-stat-card">
                        <div class="label">Turnout Rate</div>
                        <div class="value purple">${turnoutReport.turnout_percentage || 0}%</div>
                    </div>
                    <div class="print-stat-card">
                        <div class="label">Remaining</div>
                        <div class="value orange">${(turnoutReport.total_voters || 0) - (turnoutReport.voted_count || 0)}</div>
                    </div>
                </div>

                <div class="print-section-title">Turnout by Course</div>
                <div class="print-table-container">
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Total Voters</th>
                                <th>Voted</th>
                                <th>Not Voted</th>
                                <th>Turnout</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${turnoutReport.breakdown_by_course
                                ?.map(
                                    (item) => `
                                <tr>
                                    <td>${item.course || "No Course"}</td>
                                    <td>${item.total || 0}</td>
                                    <td>${item.voted || 0}</td>
                                    <td>${(item.total || 0) - (item.voted || 0)}</td>
                                    <td>${item.total > 0 ? Math.round((item.voted / item.total) * 100) : 0}%</td>
                                </tr>
                            `,
                                )
                                .join("")}
                            <tr class="total-row">
                                <td><strong>TOTAL</strong></td>
                                <td><strong>${turnoutReport.total_voters || 0}</strong></td>
                                <td><strong>${turnoutReport.voted_count || 0}</strong></td>
                                <td><strong>${(turnoutReport.total_voters || 0) - (turnoutReport.voted_count || 0)}</strong></td>
                                <td><strong>${turnoutReport.turnout_percentage || 0}%</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }

        // ===== RESULTS CONTENT =====
        if (activeTab === "results" && results?.results) {
            content = Object.entries(results.results)
                .map(([position, candidates]) => {
                    const maxVotes = Math.max(
                        ...(candidates?.map((c) => c.votes) || [0]),
                    );
                    return `
                    <div style="margin-bottom: 14px;">
                        <div class="print-sub-section-title">${position}</div>
                        <div class="print-table-container">
                            <table class="print-table print-results-table">
                                <thead>
                                    <tr>
                                        <th>Candidate</th>
                                        <th>Partylist</th>
                                        <th>Votes</th>
                                        <th>Percentage</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${candidates
                                        ?.map((candidate, idx) => {
                                            const isWinner =
                                                idx === 0 &&
                                                maxVotes > 0 &&
                                                candidate.votes === maxVotes;
                                            const percentage =
                                                maxVotes > 0
                                                    ? Math.round(
                                                          ((candidate.votes ||
                                                              0) /
                                                              maxVotes) *
                                                              100,
                                                      )
                                                    : 0;
                                            return `
                                            <tr>
                                                <td>${candidate.candidate?.user?.first_name || ""} ${candidate.candidate?.user?.last_name || ""}</td>
                                                <td>${candidate.candidate?.partylist?.name || "Independent"}</td>
                                                <td>${candidate.votes || 0}</td>
                                                <td>${percentage}%</td>
                                                <td>${isWinner ? '<span class="print-winner-badge">🏆 WINNER</span>' : ""}</td>
                                            </tr>
                                        `;
                                        })
                                        .join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                })
                .join("");
        }

        // ===== SANCTIONS CONTENT =====
        if (activeTab === "sanctions" && sanctionsList) {
            content = `
                <div class="print-stats-grid" style="grid-template-columns: repeat(2, 1fr) !important;">
                    <div class="print-stat-card">
                        <div class="label">Total Eligible Voters</div>
                        <div class="value blue">${sanctionsList.total_eligible_voters || 0}</div>
                    </div>
                    <div class="print-stat-card">
                        <div class="label">Non-Voters (Sanctions Eligible)</div>
                        <div class="value red">${sanctionsList.total_non_voters || 0}</div>
                    </div>
                </div>

                <div class="print-section-title">Non-Voters List</div>
                ${
                    sanctionsList.non_voters_list &&
                    sanctionsList.non_voters_list.length > 0
                        ? `
                    <div class="print-table-container">
                        <table class="print-table">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Course</th>
                                    <th>Year Level</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sanctionsList.non_voters_list
                                    .map(
                                        (voter) => `
                                    <tr>
                                        <td>${voter.student_id || "-"}</td>
                                        <td>${voter.first_name} ${voter.last_name}</td>
                                        <td>${voter.course || "-"}</td>
                                        <td>${voter.year_level ? `Year ${voter.year_level}` : "-"}</td>
                                        <td>${voter.email || "-"}</td>
                                    </tr>
                                `,
                                    )
                                    .join("")}
                            </tbody>
                        </table>
                    </div>
                `
                        : `
                    <p style="text-align:center; color: #0d7c3f; font-size: 13px; margin: 16px 0;">
                        ✅ No non-voters found! Everyone voted.
                    </p>
                `
                }
            `;
        }

        // Get report type label
        const reportTypeLabels: Record<string, string> = {
            turnout: "Voter Turnout Report",
            results: "Election Results Report",
            sanctions: "Sanctions Report",
        };

        const reportType = reportTypeLabels[activeTab] || "Election Report";

        // Build the complete HTML
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${reportType} - ${electionTitle}</title>
            <style>
                /* Reset */
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Times New Roman', Times, serif;
                    background: white;
                    padding: 10mm;
                    color: #1a1a1a;
                    line-height: 1.5;
                }
                
                /* All print styles from above */
                ${printStyles.replace(/@media print \{/g, "").replace(/\}$/g, "")}
                
                /* Additional inline styles */
                .print-header { display: flex !important; align-items: center !important; gap: 14px !important; margin-bottom: 14px !important; padding-bottom: 12px !important; border-bottom: 3px solid #1a1a1a !important; }
                .print-header-logo { width: 50px !important; height: 50px !important; border-radius: 50% !important; overflow: hidden !important; border: 2px solid #1a1a1a !important; flex-shrink: 0 !important; }
                .print-header-logo img { width: 100% !important; height: 100% !important; object-fit: cover !important; }
                .print-header-text { flex: 1 !important; }
                .print-header-text h1 { font-size: 18px !important; font-weight: 700 !important; color: #1a1a1a !important; margin: 0 !important; letter-spacing: 0.5px !important; }
                .print-header-text .subtitle { font-size: 12px !important; color: #555 !important; margin: 2px 0 0 0 !important; }
                .print-header-text .meta { font-size: 10px !important; color: #888 !important; margin: 4px 0 0 0 !important; }
                
                .print-report-title { text-align: center !important; margin-bottom: 16px !important; }
                .print-report-title h2 { font-size: 22px !important; font-weight: 700 !important; color: #1a1a1a !important; margin: 0 !important; letter-spacing: 1px !important; }
                .print-report-title .election-name { font-size: 14px !important; color: #444 !important; margin: 4px 0 0 0 !important; }
                .print-report-title .date-range { font-size: 11px !important; color: #888 !important; margin: 2px 0 0 0 !important; }
                
                .print-footer { text-align: center !important; font-size: 8px !important; color: #999 !important; border-top: 1px solid #ddd !important; padding-top: 8px !important; margin-top: 16px !important; }
                
                @page { margin: 12mm; size: A4 portrait; }
                .no-print { display: none !important; }
                .print-area { display: block !important; }
                .print-section-title { font-size: 14px !important; font-weight: 700 !important; color: #1a1a1a !important; margin: 16px 0 8px 0 !important; padding-bottom: 4px !important; border-bottom: 2px solid #1a1a1a !important; }
                .print-sub-section-title { font-size: 12px !important; font-weight: 600 !important; color: #333 !important; margin: 12px 0 6px 0 !important; }
                
                .print-stats-grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 10px !important; margin: 14px 0 !important; }
                .print-stat-card { border: 1px solid #ddd !important; border-radius: 6px !important; padding: 10px !important; text-align: center !important; background: #fafafa !important; }
                .print-stat-card .label { font-size: 9px !important; color: #666 !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; font-weight: 600 !important; }
                .print-stat-card .value { font-size: 22px !important; font-weight: 700 !important; color: #1a1a1a !important; margin-top: 2px !important; }
                .print-stat-card .value.green { color: #0d7c3f !important; }
                .print-stat-card .value.blue { color: #1a56db !important; }
                .print-stat-card .value.orange { color: #b45309 !important; }
                .print-stat-card .value.purple { color: #6b21a5 !important; }
                .print-stat-card .value.red { color: #b91c1c !important; }
                
                .print-table-container { margin: 8px 0 12px 0 !important; }
                .print-table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; }
                .print-table th { background: #f0f0f0 !important; border: 1px solid #ccc !important; padding: 6px 8px !important; text-align: left !important; font-weight: 700 !important; font-size: 9px !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; }
                .print-table td { border: 1px solid #ccc !important; padding: 5px 8px !important; font-size: 10px !important; }
                .print-table tr:nth-child(even) { background: #f9f9f9 !important; }
                .print-table .total-row { background: #e8e8e8 !important; font-weight: 700 !important; }
                
                .print-winner-badge { display: inline-block !important; background: #d1fae5 !important; color: #065f46 !important; padding: 1px 10px !important; border-radius: 9999px !important; font-size: 8px !important; font-weight: 700 !important; letter-spacing: 0.3px !important; }
                
                /* Print-specific overrides */
                @media print {
                    body { padding: 0 !important; }
                    .print-header { margin-bottom: 10px !important; padding-bottom: 8px !important; }
                    .print-report-title { margin-bottom: 12px !important; }
                    .print-report-title h2 { font-size: 18px !important; }
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
                        <div class="subtitle">Election System - Official Report</div>
                        <div class="meta">Generated: ${new Date().toLocaleString()}</div>
                    </div>
                </div>

                <!-- Report Title -->
                <div class="print-report-title">
                    <h2>${reportType}</h2>
                    <div class="election-name">${electionTitle}</div>
                    <div class="date-range">${electionType} • ${startDate} - ${endDate}</div>
                </div>

                <!-- Report Content -->
                ${content}

                <!-- Footer -->
                <div class="print-footer">
                    This is a system-generated report from the OCC Election System.<br>
                    © ${new Date().getFullYear()} Opol Community College. All rights reserved.
                </div>
            </div>

            <script>
                // Auto-print when loaded
                window.onload = function() {
                    window.print();
                    // Close window after print dialog closes
                    window.onafterprint = function() {
                        window.close();
                    };
                    // Fallback: close after 30 seconds if print dialog is cancelled
                    setTimeout(function() {
                        window.close();
                    }, 30000);
                };
            </script>
        </body>
        </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // ✅ Export to CSV
    const exportToCSV = (
        data: unknown[] | null,
        filename: string,
        headers?: string[],
    ): void => {
        if (!data || (Array.isArray(data) && data.length === 0)) {
            alert("No data to export");
            return;
        }

        const dataArray = Array.isArray(data) ? data : [data];
        const csvHeaders = headers || Object.keys(dataArray[0] || {});
        const csvRows = [
            csvHeaders.join(","),
            ...dataArray.map((row) =>
                csvHeaders
                    .map((h) => {
                        let value = (row as Record<string, unknown>)[h];
                        if (value === undefined || value === null) value = "";
                        if (typeof value === "object")
                            value = JSON.stringify(value);
                        return `"${String(value).replace(/"/g, '""')}"`;
                    })
                    .join(","),
            ),
        ];

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const prepareTurnoutChartData = (): Array<{
        course: string;
        total: number;
        voted: number;
        percentage: number;
    }> => {
        if (!turnoutReport?.breakdown_by_course) return [];
        return turnoutReport.breakdown_by_course.map((item) => ({
            course: item.course || "No Course",
            total: item.total || 0,
            voted: item.voted || 0,
            percentage:
                item.total > 0
                    ? Math.round((item.voted / item.total) * 100)
                    : 0,
        }));
    };

    const preparePieChartData = (): Array<{
        name: string;
        value: number;
        color: string;
    }> => {
        if (!turnoutReport) return [];
        const voted = turnoutReport.voted_count || 0;
        const notVoted = (turnoutReport.total_voters || 0) - voted;
        return [
            { name: "Voted", value: voted, color: "#10b981" },
            { name: "Not Voted", value: notVoted, color: "#ef4444" },
        ];
    };

    if (electionsLoading && !elections.length) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const currentElection = elections.find(
        (e: any) => e.election_id?.toString() === selectedElection,
    );
    const turnoutChartData = prepareTurnoutChartData();
    const pieData = preparePieChartData();

    return (
        <div className="space-y-6">
            {/* ✅ Print Styles Injection */}
            <style>{printStyles}</style>

            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4 no-print">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Election Reports & Analytics
                    </h1>
                    <p className="text-gray-600">
                        Comprehensive reports, statistics, and data
                        visualization
                    </p>
                </div>
                <div className="flex space-x-2 flex-wrap gap-2">
                    <RefreshButton
                        onClick={handleRefresh}
                        isLoading={loading}
                    />
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="bg-gray-50 hover:bg-gray-100 border-2"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Report
                    </Button>
                </div>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50 no-print">
                    <CardContent className="p-4 flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-600">{error}</span>
                    </CardContent>
                </Card>
            )}

            {/* Election Selector - Hidden on Print */}
            <Card className="no-print">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700">
                                Select Election:
                            </span>
                            <select
                                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
                                value={selectedElection}
                                onChange={(e) =>
                                    setSelectedElection(e.target.value)
                                }
                            >
                                <option value="">Select an election</option>
                                {elections.map((election: any) => (
                                    <option
                                        key={election.election_id}
                                        value={election.election_id}
                                    >
                                        {election.title} -{" "}
                                        {new Date(
                                            election.voting_start,
                                        ).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {currentElection && (
                            <Badge className="bg-blue-100 text-blue-800">
                                {currentElection.election_type} Election
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabs - Hidden on Print */}
            <div className="no-print">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="space-y-4"
                >
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="turnout">
                            <TrendingUp className="w-4 h-4 mr-2" /> Voter
                            Turnout
                        </TabsTrigger>
                        <TabsTrigger value="results">
                            <BarChart3 className="w-4 h-4 mr-2" /> Election
                            Results
                        </TabsTrigger>
                        <TabsTrigger value="sanctions">
                            <FileText className="w-4 h-4 mr-2" /> Sanctions List
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* ===== TURNOUT TAB ===== */}
            <div className={activeTab === "turnout" ? "block" : "hidden"}>
                <div className="no-print flex justify-end space-x-2 flex-wrap gap-2 mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="bg-red-50 hover:bg-red-100"
                    >
                        <Printer className="w-4 h-4 mr-2" /> Print Report
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const summaryData = [
                                {
                                    Metric: "Total Voters",
                                    Value: turnoutReport?.total_voters || 0,
                                },
                                {
                                    Metric: "Votes Cast",
                                    Value: turnoutReport?.voted_count || 0,
                                },
                                {
                                    Metric: "Turnout Percentage",
                                    Value: `${turnoutReport?.turnout_percentage || 0}%`,
                                },
                            ];
                            exportToCSV(summaryData, "turnout_summary");
                        }}
                        disabled={!turnoutReport}
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Export
                        Summary
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            exportToCSV(
                                turnoutReport?.breakdown_by_course || null,
                                "turnout_by_course",
                            )
                        }
                        disabled={!turnoutReport?.breakdown_by_course?.length}
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Export
                        Breakdown
                    </Button>
                </div>

                {turnoutReport ? (
                    <>
                        {/* Stats Pills */}
                        <div className="flex flex-wrap items-center gap-3 py-1 no-print">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-600">
                                    Total Voters
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                    {turnoutReport.total_voters || 0}
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                                <Vote className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                    Votes Cast
                                </span>
                                <span className="text-sm font-bold text-green-800">
                                    {turnoutReport.voted_count || 0}
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-700">
                                    Turnout
                                </span>
                                <span className="text-sm font-bold text-purple-800">
                                    {turnoutReport.turnout_percentage || 0}%
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full">
                                <Clock className="w-4 h-4 text-orange-600" />
                                <span className="text-sm font-medium text-orange-700">
                                    Remaining
                                </span>
                                <span className="text-sm font-bold text-orange-800">
                                    {(turnoutReport.total_voters || 0) -
                                        (turnoutReport.voted_count || 0)}
                                </span>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <PieChartIcon className="w-5 h-5 text-blue-600" />
                                        Voter Participation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {pieData.length > 0 &&
                                    pieData[0].value > 0 ? (
                                        <div className="h-[300px]">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={(entry: any) => {
                                                            const name =
                                                                entry.name ||
                                                                "";
                                                            const percent =
                                                                entry.percent ||
                                                                0;
                                                            return `${name}: ${(percent * 100).toFixed(0)}%`;
                                                        }}
                                                    >
                                                        {pieData.map(
                                                            (entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={
                                                                        entry.color
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-gray-500">
                                            No data available
                                        </div>
                                    )}
                                    <div className="mt-4 text-center">
                                        <p className="text-sm text-gray-600">
                                            Overall Turnout
                                        </p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {turnoutReport.turnout_percentage ||
                                                0}
                                            %
                                        </p>
                                        <Progress
                                            value={
                                                turnoutReport.turnout_percentage ||
                                                0
                                            }
                                            className="mt-2 h-2"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-green-600" />
                                        Turnout by Course
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {turnoutChartData.length > 0 ? (
                                        <div className="h-[300px]">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <BarChart
                                                    data={turnoutChartData}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="course" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="voted"
                                                        fill="#3b82f6"
                                                        name="Voted"
                                                    />
                                                    <Bar
                                                        dataKey="total"
                                                        fill="#10b981"
                                                        name="Total Voters"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-gray-500">
                                            No course data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detailed Breakdown Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Detailed Turnout Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="p-3 text-left">
                                                    Category
                                                </th>
                                                <th className="p-3 text-left">
                                                    Total Voters
                                                </th>
                                                <th className="p-3 text-left">
                                                    Voted
                                                </th>
                                                <th className="p-3 text-left">
                                                    Not Voted
                                                </th>
                                                <th className="p-3 text-left">
                                                    Turnout
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {turnoutReport.breakdown_by_course?.map(
                                                (item, index) => (
                                                    <tr
                                                        key={index}
                                                        className="border-t"
                                                    >
                                                        <td className="p-3 font-medium">
                                                            {item.course}
                                                        </td>
                                                        <td className="p-3">
                                                            {item.total}
                                                        </td>
                                                        <td className="p-3 text-green-600">
                                                            {item.voted}
                                                        </td>
                                                        <td className="p-3 text-red-600">
                                                            {item.total -
                                                                item.voted}
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-semibold">
                                                                    {item.total >
                                                                    0
                                                                        ? Math.round(
                                                                              (item.voted /
                                                                                  item.total) *
                                                                                  100,
                                                                          )
                                                                        : 0}
                                                                    %
                                                                </span>
                                                                <Progress
                                                                    value={
                                                                        item.total >
                                                                        0
                                                                            ? (item.voted /
                                                                                  item.total) *
                                                                              100
                                                                            : 0
                                                                    }
                                                                    className="w-24 h-2"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                        <tfoot className="bg-gray-50 font-semibold">
                                            <tr className="border-t">
                                                <td className="p-3">TOTAL</td>
                                                <td className="p-3">
                                                    {turnoutReport.total_voters ||
                                                        0}
                                                </td>
                                                <td className="p-3 text-green-600">
                                                    {turnoutReport.voted_count ||
                                                        0}
                                                </td>
                                                <td className="p-3 text-red-600">
                                                    {(turnoutReport.total_voters ||
                                                        0) -
                                                        (turnoutReport.voted_count ||
                                                            0)}
                                                </td>
                                                <td className="p-3">
                                                    {turnoutReport.turnout_percentage ||
                                                        0}
                                                    %
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card>
                        <CardContent className="text-center py-12">
                            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500">
                                No turnout data available for this election
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ===== RESULTS TAB ===== */}
            <div className={activeTab === "results" ? "block" : "hidden"}>
                <div className="no-print flex justify-end space-x-2 flex-wrap gap-2 mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="bg-red-50 hover:bg-red-100"
                    >
                        <Printer className="w-4 h-4 mr-2" /> Print Report
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (!results?.results) return;
                            const resultsData: Array<{
                                Position: string;
                                Candidate: string;
                                Partylist: string;
                                Votes: number;
                            }> = [];
                            Object.entries(results.results).forEach(
                                ([position, candidates]) => {
                                    candidates.forEach((candidate) => {
                                        resultsData.push({
                                            Position: position,
                                            Candidate:
                                                `${candidate.candidate?.user?.first_name || ""} ${candidate.candidate?.user?.last_name || ""}`.trim(),
                                            Partylist:
                                                candidate.candidate?.partylist
                                                    ?.name || "Independent",
                                            Votes: candidate.votes || 0,
                                        });
                                    });
                                },
                            );
                            exportToCSV(resultsData, "election_results");
                        }}
                        disabled={!results?.results}
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                </div>

                {results?.results && Object.keys(results.results).length > 0 ? (
                    Object.entries(results.results).map(
                        ([position, candidates]) => {
                            const maxVotes = Math.max(
                                ...(candidates?.map((c) => c.votes) || [0]),
                            );
                            return (
                                <Card key={position}>
                                    <CardHeader className="bg-gray-50">
                                        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center">
                                                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                                                {position}
                                            </div>
                                            <Badge className="bg-green-100 text-green-800">
                                                Winner:{" "}
                                                {candidates[0]?.candidate?.user
                                                    ?.first_name || ""}{" "}
                                                {candidates[0]?.candidate?.user
                                                    ?.last_name || ""}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            {candidates?.map(
                                                (candidate, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="space-y-2"
                                                    >
                                                        <div className="flex justify-between items-center flex-wrap gap-2">
                                                            <div>
                                                                <span className="font-medium">
                                                                    {candidate
                                                                        .candidate
                                                                        ?.user
                                                                        ?.first_name ||
                                                                        ""}{" "}
                                                                    {candidate
                                                                        .candidate
                                                                        ?.user
                                                                        ?.last_name ||
                                                                        ""}
                                                                </span>
                                                                {candidate
                                                                    .candidate
                                                                    ?.partylist && (
                                                                    <span className="text-sm text-gray-500 ml-2">
                                                                        (
                                                                        {
                                                                            candidate
                                                                                .candidate
                                                                                .partylist
                                                                                .name
                                                                        }
                                                                        )
                                                                    </span>
                                                                )}
                                                                {idx === 0 &&
                                                                    maxVotes >
                                                                        0 &&
                                                                    candidate.votes ===
                                                                        maxVotes && (
                                                                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                                                                            🏆
                                                                            Winner
                                                                        </Badge>
                                                                    )}
                                                            </div>
                                                            <div className="flex items-center space-x-4">
                                                                <span className="font-bold text-xl text-gray-900">
                                                                    {candidate.votes ||
                                                                        0}
                                                                </span>
                                                                <span className="text-sm text-gray-500">
                                                                    votes
                                                                </span>
                                                                <span className="text-sm text-gray-500 w-16">
                                                                    {maxVotes >
                                                                    0
                                                                        ? `${Math.round(((candidate.votes || 0) / maxVotes) * 100)}%`
                                                                        : "0%"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Progress
                                                            value={
                                                                maxVotes > 0
                                                                    ? ((candidate.votes ||
                                                                          0) /
                                                                          maxVotes) *
                                                                      100
                                                                    : 0
                                                            }
                                                            className="h-2"
                                                        />
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        },
                    )
                ) : (
                    <Card>
                        <CardContent className="text-center py-12">
                            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500">
                                No results available for this election yet
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                Results will appear after the election ends
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ===== SANCTIONS TAB ===== */}
            <div className={activeTab === "sanctions" ? "block" : "hidden"}>
                {sanctionsList ? (
                    <>
                        <div className="no-print flex justify-end space-x-2 flex-wrap gap-2 mb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                className="bg-red-50 hover:bg-red-100"
                            >
                                <Printer className="w-4 h-4 mr-2" /> Print
                                Report
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    exportToCSV(
                                        sanctionsList.non_voters_list,
                                        "sanctions_list",
                                    )
                                }
                            >
                                <Download className="w-4 h-4 mr-2" /> Export CSV
                            </Button>
                        </div>

                        {/* Stats Pills */}
                        <div className="flex flex-wrap items-center gap-3 py-1 no-print">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-600">
                                    Total Eligible
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                    {sanctionsList.total_eligible_voters || 0}
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-red-700">
                                    Non-Voters
                                </span>
                                <span className="text-sm font-bold text-red-800">
                                    {sanctionsList.total_non_voters || 0}
                                </span>
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-red-600" />
                                    Sanctions List - Non-Voters
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sanctionsList.non_voters_list &&
                                sanctionsList.non_voters_list.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="p-3 text-left">
                                                        Student ID
                                                    </th>
                                                    <th className="p-3 text-left">
                                                        Name
                                                    </th>
                                                    <th className="p-3 text-left">
                                                        Course
                                                    </th>
                                                    <th className="p-3 text-left">
                                                        Year Level
                                                    </th>
                                                    <th className="p-3 text-left">
                                                        Email
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sanctionsList.non_voters_list.map(
                                                    (voter, index) => (
                                                        <tr
                                                            key={index}
                                                            className="border-t"
                                                        >
                                                            <td className="p-3 font-mono">
                                                                {voter.student_id ||
                                                                    "-"}
                                                            </td>
                                                            <td className="p-3 font-medium">
                                                                {
                                                                    voter.first_name
                                                                }{" "}
                                                                {
                                                                    voter.last_name
                                                                }
                                                            </td>
                                                            <td className="p-3">
                                                                {voter.course ||
                                                                    "-"}
                                                            </td>
                                                            <td className="p-3">
                                                                {voter.year_level
                                                                    ? `Year ${voter.year_level}`
                                                                    : "-"}
                                                            </td>
                                                            <td className="p-3">
                                                                {voter.email ||
                                                                    "-"}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                                        <p>
                                            No non-voters found! Everyone voted.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card>
                        <CardContent className="text-center py-12">
                            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500">
                                No sanctions data available
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Reports;
