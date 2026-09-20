// resources/js/pages/Monitoring/MonitoringAudit.tsx
import React, { useState, useEffect } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { monitoringAPI } from "../api/monitoring";
import { electionAPI } from "../api/elections";
import { adminAPI } from "../api/admin";
import {
    Shield,
    RefreshCw,
    Loader2,
    Search,
    Filter,
    Clock,
    User,
    Database,
    AlertTriangle,
    Award,
    Download,
    Calendar,
    Activity,
    Fingerprint,
    FileText,
    Vote,
    CheckCircle,
    XCircle,
    Users,
    UserCheck,
    BookOpen,
    Printer,
    Bell,
    LogIn,
    LogOut,
    UserPlus,
    UserMinus,
    Edit,
    Trash,
    Plus,
    Building2,
    Calendar as CalendarIcon,
    MessageCircle,
    Mail,
    Settings,
    Upload,
    Download as DownloadIcon,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
    voting_start: string;
    voting_end: string;
}

interface AuditLog {
    log_id: number;
    user_id: number;
    action_type: string;
    target_table?: string;
    target_id?: number;
    ip_address?: string;
    timestamp: string;
    old_value?: Record<string, unknown>;
    new_value?: Record<string, unknown>;
    user?: {
        user_id: number;
        first_name: string;
        last_name: string;
        email: string;
        student_id?: string;
        role?: string;
    };
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface AuditStats {
    total: number;
    today: number;
    last_hour: number;
    by_action: Array<{ action_type: string; count: number }>;
    by_table: Array<{ target_table: string; count: number }>;
}

// ✅ Action Configuration
const DEFAULT_ACTION_CONFIG: Record<
    string,
    {
        label: string;
        description: string;
        icon: React.ElementType;
        color: string;
    }
> = {
    // Auth actions
    LOGIN: {
        label: "User Login",
        description: "User logged into the system",
        icon: LogIn,
        color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    LOGOUT: {
        label: "User Logout",
        description: "User logged out of the system",
        icon: LogOut,
        color: "bg-gray-100 text-gray-800 border-gray-200",
    },
    REGISTER: {
        label: "User Registration",
        description: "New user registered an account",
        icon: UserPlus,
        color: "bg-green-100 text-green-800 border-green-200",
    },
    // User management
    CREATE_USER: {
        label: "User Created",
        description: "Admin created a new user account",
        icon: UserPlus,
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    },
    UPDATE_USER: {
        label: "User Updated",
        description: "User information was updated",
        icon: Edit,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    DELETE_USER: {
        label: "User Deleted",
        description: "User account was deleted",
        icon: Trash,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    // Election management
    CREATE_ELECTION: {
        label: "Election Created",
        description: "A new election was created",
        icon: Plus,
        color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    UPDATE_ELECTION: {
        label: "Election Updated",
        description: "Election details were updated",
        icon: Edit,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    DELETE_ELECTION: {
        label: "Election Deleted",
        description: "An election was deleted",
        icon: Trash,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    // Position management
    CREATE_POSITION: {
        label: "Position Created",
        description: "A new election position was created",
        icon: Plus,
        color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    UPDATE_POSITION: {
        label: "Position Updated",
        description: "Position details were updated",
        icon: Edit,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    DELETE_POSITION: {
        label: "Position Deleted",
        description: "An election position was deleted",
        icon: Trash,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    // Candidate management
    ADD_CANDIDATE: {
        label: "Candidate Added",
        description: "A new candidate was added to the election",
        icon: UserPlus,
        color: "bg-green-100 text-green-800 border-green-200",
    },
    BULK_ADD_CANDIDATES: {
        label: "Bulk Candidates Added",
        description: "Multiple candidates were added at once",
        icon: Upload,
        color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    },
    UPDATE_CANDIDATE: {
        label: "Candidate Updated",
        description: "Candidate information was updated",
        icon: Edit,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    DELETE_CANDIDATE: {
        label: "Candidate Removed",
        description: "A candidate was removed from the election",
        icon: Trash,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    APPROVE_CANDIDATE: {
        label: "Candidate Approved",
        description: "A candidate was approved for the election",
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 border-green-200",
    },
    REJECT_CANDIDATE: {
        label: "Candidate Rejected",
        description: "A candidate was rejected from the election",
        icon: XCircle,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    // Partylist management
    CREATE_PARTYLIST: {
        label: "Partylist Created",
        description: "A new partylist was created",
        icon: Plus,
        color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    UPDATE_PARTYLIST: {
        label: "Partylist Updated",
        description: "Partylist details were updated",
        icon: Edit,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    DELETE_PARTYLIST: {
        label: "Partylist Deleted",
        description: "A partylist was deleted",
        icon: Trash,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    // Voting actions
    CAST_VOTE: {
        label: "Vote Cast",
        description: "A user cast their vote",
        icon: Vote,
        color: "bg-green-100 text-green-800 border-green-200",
    },
    VOTE_CONFIRMED: {
        label: "Vote Confirmed",
        description: "A vote was successfully confirmed",
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 border-green-200",
    },
    // Voter management
    REGISTER_VOTER: {
        label: "Voter Registered",
        description: "A voter was registered for an election",
        icon: UserPlus,
        color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    IMPORT_VOTERS: {
        label: "Voters Imported",
        description: "Voters were imported from a file",
        icon: Upload,
        color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    },
    REMOVE_VOTER: {
        label: "Voter Removed",
        description: "A voter was removed from the election",
        icon: UserMinus,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    // Candidacy applications
    SUBMIT_CANDIDACY_APPLICATION: {
        label: "Candidacy Applied",
        description: "A user submitted a candidacy application",
        icon: FileText,
        color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    ADMIN_APPROVE_CANDIDATE: {
        label: "Admin Approved Candidate",
        description: "Admin approved a candidacy application",
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 border-green-200",
    },
    ADMIN_REJECT_CANDIDATE: {
        label: "Admin Rejected Candidate",
        description: "Admin rejected a candidacy application",
        icon: XCircle,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    COMELEC_APPROVE_CANDIDATE: {
        label: "COMELEC Approved Candidate",
        description: "COMELEC approved a candidate",
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 border-green-200",
    },
    COMELEC_REJECT_CANDIDATE: {
        label: "COMELEC Rejected Candidate",
        description: "COMELEC rejected a candidate",
        icon: XCircle,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    // Campaign posts
    CREATE_CAMPAIGN_POST: {
        label: "Campaign Post Created",
        description: "A campaign post was created",
        icon: Plus,
        color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    UPDATE_CAMPAIGN_POST: {
        label: "Campaign Post Updated",
        description: "A campaign post was updated",
        icon: Edit,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    DELETE_CAMPAIGN_POST: {
        label: "Campaign Post Deleted",
        description: "A campaign post was deleted",
        icon: Trash,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    // Comments
    POST_COMMENT: {
        label: "Comment Posted",
        description: "A comment was posted",
        icon: MessageCircle,
        color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    MODERATE_COMMENT: {
        label: "Comment Moderated",
        description: "A comment was moderated (hidden/shown)",
        icon: Shield,
        color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    DELETE_COMMENT: {
        label: "Comment Deleted",
        description: "A comment was deleted",
        icon: Trash,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    // Feedback
    SUBMIT_FEEDBACK: {
        label: "Feedback Submitted",
        description: "A user submitted feedback",
        icon: MessageCircle,
        color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    RESPOND_FEEDBACK: {
        label: "Feedback Responded",
        description: "Admin responded to feedback",
        icon: Mail,
        color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    // Face registration
    REGISTER_FACE: {
        label: "Face Registered",
        description: "A user registered their face for login",
        icon: Fingerprint,
        color: "bg-teal-100 text-teal-800 border-teal-200",
    },
    DELETE_FACE: {
        label: "Face Removed",
        description: "A user's face registration was removed",
        icon: Trash,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    REGISTER_FACE_MOBILE: {
        label: "Face Registered (Mobile)",
        description: "A user registered their face via mobile app",
        icon: Fingerprint,
        color: "bg-teal-100 text-teal-800 border-teal-200",
    },
    // Password
    CHANGE_PASSWORD: {
        label: "Password Changed",
        description: "A user changed their password",
        icon: Settings,
        color: "bg-gray-100 text-gray-800 border-gray-200",
    },
    RESET_PASSWORD: {
        label: "Password Reset",
        description: "A user reset their password",
        icon: Settings,
        color: "bg-gray-100 text-gray-800 border-gray-200",
    },
    // Schedule
    CREATE_CAMPAIGN_SCHEDULE: {
        label: "Campaign Schedule Created",
        description: "A campaign schedule was created",
        icon: Plus,
        color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    UPDATE_CAMPAIGN_SCHEDULE: {
        label: "Campaign Schedule Updated",
        description: "A campaign schedule was updated",
        icon: Edit,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    DELETE_CAMPAIGN_SCHEDULE: {
        label: "Campaign Schedule Deleted",
        description: "A campaign schedule was deleted",
        icon: Trash,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    BULK_CREATE_CAMPAIGN_SCHEDULES: {
        label: "Bulk Schedules Created",
        description: "Multiple campaign schedules were created",
        icon: Upload,
        color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    },
    // Schedule requests
    CREATE_SCHEDULE_REQUEST: {
        label: "Schedule Request Submitted",
        description: "A candidate submitted a schedule request",
        icon: FileText,
        color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    APPROVE_SCHEDULE_REQUEST: {
        label: "Schedule Request Approved",
        description: "A schedule request was approved",
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 border-green-200",
    },
    REJECT_SCHEDULE_REQUEST: {
        label: "Schedule Request Rejected",
        description: "A schedule request was rejected",
        icon: XCircle,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    RESCHEDULE_REQUEST: {
        label: "Schedule Request Rescheduled",
        description: "A schedule request was rescheduled",
        icon: CalendarIcon,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    DELETE_SCHEDULE_REQUEST: {
        label: "Schedule Request Cancelled",
        description: "A schedule request was cancelled",
        icon: Trash,
        color: "bg-red-100 text-red-800 border-red-200",
    },
    // Partylist membership
    CANDIDATE_APPLY_PARTYLIST: {
        label: "Partylist Application",
        description: "A candidate applied to join a partylist",
        icon: UserPlus,
        color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    HANDLE_PARTYLIST_REQUEST: {
        label: "Partylist Request Processed",
        description: "A partylist request was processed",
        icon: Shield,
        color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    CANDIDATE_CREATE_PARTYLIST: {
        label: "Partylist Created by Candidate",
        description: "A candidate created a partylist",
        icon: Plus,
        color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    // Export
    EXPORT_REPORT: {
        label: "Report Exported",
        description: "A report was exported",
        icon: DownloadIcon,
        color: "bg-orange-100 text-orange-800 border-orange-200",
    },
};

// ✅ Target table display names
const TARGET_TABLE_NAMES: Record<
    string,
    { label: string; icon: React.ElementType; color: string }
> = {
    users: {
        label: "User Account",
        icon: User,
        color: "bg-blue-50 text-blue-700",
    },
    elections: {
        label: "Election",
        icon: Vote,
        color: "bg-purple-50 text-purple-700",
    },
    positions: {
        label: "Position",
        icon: Award,
        color: "bg-indigo-50 text-indigo-700",
    },
    candidates: {
        label: "Candidate",
        icon: UserCheck,
        color: "bg-green-50 text-green-700",
    },
    partylists: {
        label: "Partylist",
        icon: Building2,
        color: "bg-pink-50 text-pink-700",
    },
    voter_registries: {
        label: "Voter Registry",
        icon: Users,
        color: "bg-blue-50 text-blue-700",
    },
    votes: { label: "Vote", icon: Vote, color: "bg-green-50 text-green-700" },
    campaign_schedules: {
        label: "Campaign Schedule",
        icon: CalendarIcon,
        color: "bg-yellow-50 text-yellow-700",
    },
    campaign_schedule_requests: {
        label: "Schedule Request",
        icon: FileText,
        color: "bg-orange-50 text-orange-700",
    },
    candidacy_applications: {
        label: "Candidacy Application",
        icon: FileText,
        color: "bg-purple-50 text-purple-700",
    },
    campaign_posts: {
        label: "Campaign Post",
        icon: MessageCircle,
        color: "bg-blue-50 text-blue-700",
    },
    post_comments: {
        label: "Post Comment",
        icon: MessageCircle,
        color: "bg-green-50 text-green-700",
    },
    feedback: {
        label: "Feedback",
        icon: MessageCircle,
        color: "bg-purple-50 text-purple-700",
    },
    live_comments: {
        label: "Live Comment",
        icon: MessageCircle,
        color: "bg-blue-50 text-blue-700",
    },
    partylist_memberships: {
        label: "Partylist Membership",
        icon: Users,
        color: "bg-pink-50 text-pink-700",
    },
    digital_receipts: {
        label: "Digital Receipt",
        icon: FileText,
        color: "bg-gray-50 text-gray-700",
    },
    audit_logs: {
        label: "Audit Log",
        icon: Shield,
        color: "bg-gray-50 text-gray-700",
    },
    notifications: {
        label: "Notification",
        icon: Bell,
        color: "bg-yellow-50 text-yellow-700",
    },
    courses: {
        label: "Course",
        icon: BookOpen,
        color: "bg-blue-50 text-blue-700",
    },
    course_sections: {
        label: "Course Section",
        icon: BookOpen,
        color: "bg-green-50 text-green-700",
    },
};

const printStyles = `
@media print {
    .no-print { display: none !important; }
    .print-area { display: block !important; padding: 10mm !important; }
    @page { margin: 12mm; size: A4 portrait; }
    .print-header { display: flex !important; align-items: center !important; gap: 14px !important; margin-bottom: 14px !important; padding-bottom: 12px !important; border-bottom: 3px solid #1a1a1a !important; }
    .print-header-text h1 { font-size: 18px !important; font-weight: 700 !important; color: #1a1a1a !important; margin: 0 !important; }
    .print-header-text .subtitle { font-size: 12px !important; color: #555 !important; margin: 2px 0 0 0 !important; }
    .print-header-text .meta { font-size: 10px !important; color: #888 !important; margin: 4px 0 0 0 !important; }
    .print-report-title { text-align: center !important; margin-bottom: 16px !important; }
    .print-report-title h2 { font-size: 20px !important; font-weight: 700 !important; color: #1a1a1a !important; margin: 0 !important; }
    .print-report-title .election-name { font-size: 14px !important; color: #444 !important; margin: 4px 0 0 0 !important; }
    .print-stats-grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 10px !important; margin: 14px 0 !important; }
    .print-stat-card { border: 1px solid #ddd !important; border-radius: 6px !important; padding: 10px !important; text-align: center !important; background: #fafafa !important; }
    .print-stat-card .label { font-size: 9px !important; color: #666 !important; text-transform: uppercase !important; font-weight: 600 !important; }
    .print-stat-card .value { font-size: 22px !important; font-weight: 700 !important; color: #1a1a1a !important; margin-top: 2px !important; }
    .print-table { width: 100% !important; border-collapse: collapse !important; font-size: 9px !important; }
    .print-table th { background: #f0f0f0 !important; border: 1px solid #ccc !important; padding: 5px 8px !important; text-align: left !important; font-weight: 700 !important; font-size: 8px !important; text-transform: uppercase !important; }
    .print-table td { border: 1px solid #ccc !important; padding: 4px 8px !important; font-size: 9px !important; }
    .print-table tr:nth-child(even) { background: #f9f9f9 !important; }
    .print-footer { text-align: center !important; font-size: 8px !important; color: #999 !important; border-top: 1px solid #ddd !important; padding-top: 8px !important; margin-top: 16px !important; }
    .print-winner-badge { display: inline-block !important; background: #d1fae5 !important; color: #065f46 !important; padding: 1px 8px !important; border-radius: 9999px !important; font-size: 7px !important; font-weight: 700 !important; }
}
`;

const ITEMS_PER_PAGE = 10;

const MonitoringAudit: React.FC = () => {
    const [elections, setElections] = useState<Election[]>([]);
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [allAuditLogs, setAllAuditLogs] = useState<AuditLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
    const [displayLogs, setDisplayLogs] = useState<AuditLog[]>([]);
    const [voteStats, setVoteStats] = useState<{
        total_voters: number;
        voted_count: number;
        not_voted_count: number;
        turnout_percentage: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [targetFilter, setTargetFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [auditStats, setAuditStats] = useState<AuditStats | null>(null);

    // ✅ Pagination state (FIXED)
    const [pagination, setPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        per_page: ITEMS_PER_PAGE,
        total: 0,
    });

    // Dynamic action types from database
    const [availableActions, setAvailableActions] = useState<string[]>([]);
    const [availableTargets, setAvailableTargets] = useState<string[]>([]);

    useEffect(() => {
        fetchElections();
    }, []);

    useEffect(() => {
        if (selectedElection) {
            fetchAuditLogs();
            fetchVoteStats();
        } else {
            fetchAllAuditLogs();
        }
    }, [selectedElection]);

    useEffect(() => {
        filterLogs();
    }, [allAuditLogs, searchTerm, actionFilter, targetFilter]);

    useEffect(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        setDisplayLogs(filteredLogs.slice(start, end));
    }, [filteredLogs, currentPage]);

    const fetchElections = async (): Promise<void> => {
        try {
            const response = await electionAPI.getAll();
            const electionsData = response.data;
            setElections(Array.isArray(electionsData) ? electionsData : []);
            if (electionsData && electionsData.length > 0) {
                setSelectedElection(electionsData[0].election_id.toString());
            }
        } catch (error) {
            console.error("Failed to fetch elections:", error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fetch audit logs for specific election
    const fetchAuditLogs = async (): Promise<void> => {
        if (!selectedElection) return;
        setLoading(true);
        try {
            const response =
                await monitoringAPI.getAuditTrail(selectedElection);
            const auditData = response.data;
            let logs = auditData?.audit_logs || [];

            if (Array.isArray(logs)) {
                console.log(`✅ Retrieved ${logs.length} audit logs`);
                setAllAuditLogs(logs);
                setFilteredLogs(logs);
                setPagination({
                    current_page: 1,
                    last_page: Math.ceil(logs.length / ITEMS_PER_PAGE),
                    per_page: ITEMS_PER_PAGE,
                    total: logs.length,
                });

                const actions = [
                    ...new Set(logs.map((log: AuditLog) => log.action_type)),
                ].filter(Boolean);
                const targets = [
                    ...new Set(logs.map((log: AuditLog) => log.target_table)),
                ].filter(Boolean);

                setAvailableActions(actions);
                setAvailableTargets(targets);
            } else {
                setAllAuditLogs([]);
                setFilteredLogs([]);
            }
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
            setAllAuditLogs([]);
            setFilteredLogs([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fetch ALL audit logs (no election filter)
    const fetchAllAuditLogs = async (): Promise<void> => {
        setLoading(true);
        try {
            const response = await monitoringAPI.getAllAuditTrail();
            const data = response.data;

            let logs = data?.data?.data || [];
            const stats = data?.stats || null;

            if (Array.isArray(logs)) {
                console.log(`✅ Retrieved ${logs.length} audit logs (all)`);
                setAllAuditLogs(logs);
                setFilteredLogs(logs);
                setAuditStats(stats);
                setPagination({
                    current_page: 1,
                    last_page: Math.ceil(logs.length / ITEMS_PER_PAGE),
                    per_page: ITEMS_PER_PAGE,
                    total: logs.length,
                });

                const actions = [
                    ...new Set(logs.map((log: AuditLog) => log.action_type)),
                ].filter(Boolean);
                const targets = [
                    ...new Set(logs.map((log: AuditLog) => log.target_table)),
                ].filter(Boolean);

                setAvailableActions(actions);
                setAvailableTargets(targets);
            } else {
                setAllAuditLogs([]);
                setFilteredLogs([]);
            }
        } catch (error) {
            console.error("Failed to fetch all audit logs:", error);
            setAllAuditLogs([]);
            setFilteredLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchVoteStats = async (): Promise<void> => {
        if (!selectedElection) return;
        try {
            let statsData = null;
            try {
                const statsResponse =
                    await adminAPI.getVoterStats(selectedElection);
                statsData = statsResponse.data;
            } catch (statsError) {
                console.warn("Failed to fetch voter stats:", statsError);
            }

            const totalVoters =
                statsData?.data?.total_voters || statsData?.total_voters || 0;
            const votedCount =
                statsData?.data?.voted_count || statsData?.voted_count || 0;
            const turnoutPercentage =
                statsData?.data?.turnout_percentage ||
                statsData?.turnout_percentage ||
                0;

            setVoteStats({
                total_voters: totalVoters,
                voted_count: votedCount,
                not_voted_count: totalVoters - votedCount,
                turnout_percentage: turnoutPercentage,
            });
        } catch (error) {
            console.error("Failed to fetch vote stats:", error);
            setVoteStats({
                total_voters: 0,
                voted_count: 0,
                not_voted_count: 0,
                turnout_percentage: 0,
            });
        }
    };

    const filterLogs = (): void => {
        let filtered = [...allAuditLogs];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (log) =>
                    (log.action_type &&
                        log.action_type.toLowerCase().includes(search)) ||
                    (log.user?.first_name &&
                        log.user.first_name.toLowerCase().includes(search)) ||
                    (log.user?.last_name &&
                        log.user.last_name.toLowerCase().includes(search)) ||
                    (log.user?.email &&
                        log.user.email.toLowerCase().includes(search)) ||
                    (log.target_table &&
                        log.target_table.toLowerCase().includes(search)),
            );
        }

        if (actionFilter !== "all") {
            filtered = filtered.filter(
                (log) => log.action_type === actionFilter,
            );
        }

        if (targetFilter !== "all") {
            filtered = filtered.filter(
                (log) => log.target_table === targetFilter,
            );
        }

        setFilteredLogs(filtered);
        setCurrentPage(1);
        setPagination((prev) => ({
            ...prev,
            current_page: 1,
            last_page: Math.ceil(filtered.length / ITEMS_PER_PAGE),
            total: filtered.length,
        }));
    };

    const refreshData = async (): Promise<void> => {
        setRefreshing(true);
        if (selectedElection) {
            await Promise.all([fetchAuditLogs(), fetchVoteStats()]);
        } else {
            await fetchAllAuditLogs();
        }
        setRefreshing(false);
    };

    const getActionConfig = (actionType: string) => {
        return (
            DEFAULT_ACTION_CONFIG[actionType] || {
                label: actionType
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()),
                description: "System action",
                icon: Activity,
                color: "bg-gray-100 text-gray-800 border-gray-200",
            }
        );
    };

    const getTargetTableInfo = (tableName?: string) => {
        if (!tableName)
            return {
                label: "Unknown",
                icon: Database,
                color: "bg-gray-50 text-gray-700",
            };
        return (
            TARGET_TABLE_NAMES[tableName] || {
                label: tableName
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()),
                icon: Database,
                color: "bg-gray-50 text-gray-700",
            }
        );
    };

    const isVoteAction = (actionType: string): boolean => {
        return actionType === "CAST_VOTE" || actionType === "VOTE_CONFIRMED";
    };

    const exportToCSV = (): void => {
        const headers = [
            "Log ID",
            "Timestamp",
            "User",
            "Email",
            "Action",
            "Target Table",
            "Target ID",
            "IP Address",
        ];
        const csvData = filteredLogs.map((log) => [
            log.log_id,
            new Date(log.timestamp).toLocaleString(),
            `${log.user?.first_name || ""} ${log.user?.last_name || ""}`.trim(),
            log.user?.email || "",
            getActionConfig(log.action_type).label,
            log.target_table || "",
            log.target_id || "",
            log.ip_address || "",
        ]);

        const csvContent = [headers, ...csvData]
            .map((row) => row.join(","))
            .join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit_logs_${selectedElection || "all"}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (!printWindow) {
            alert("Please allow popups to print the report");
            return;
        }

        const election = elections.find(
            (e: any) => e.election_id?.toString() === selectedElection,
        );
        const electionTitle = election?.title || "All Elections";
        const printLogs = filteredLogs.slice(0, 50);

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Transparency Report - ${electionTitle}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Times New Roman', Times, serif; background: white; padding: 10mm; color: #1a1a1a; line-height: 1.5; }
                ${printStyles}
                .print-header { display: flex !important; align-items: center !important; gap: 14px !important; margin-bottom: 14px !important; padding-bottom: 12px !important; border-bottom: 3px solid #1a1a1a !important; }
                .print-header-text h1 { font-size: 18px !important; font-weight: 700 !important; color: #1a1a1a !important; margin: 0 !important; }
                .print-header-text .subtitle { font-size: 12px !important; color: #555 !important; margin: 2px 0 0 0 !important; }
                .print-header-text .meta { font-size: 10px !important; color: #888 !important; margin: 4px 0 0 0 !important; }
                .print-report-title { text-align: center !important; margin-bottom: 16px !important; }
                .print-report-title h2 { font-size: 20px !important; font-weight: 700 !important; color: #1a1a1a !important; margin: 0 !important; }
                .print-report-title .election-name { font-size: 14px !important; color: #444 !important; margin: 4px 0 0 0 !important; }
                .print-stats-grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 10px !important; margin: 14px 0 !important; }
                .print-stat-card { border: 1px solid #ddd !important; border-radius: 6px !important; padding: 10px !important; text-align: center !important; background: #fafafa !important; }
                .print-stat-card .label { font-size: 9px !important; color: #666 !important; text-transform: uppercase !important; font-weight: 600 !important; }
                .print-stat-card .value { font-size: 22px !important; font-weight: 700 !important; color: #1a1a1a !important; margin-top: 2px !important; }
                .print-table { width: 100% !important; border-collapse: collapse !important; font-size: 8px !important; }
                .print-table th { background: #f0f0f0 !important; border: 1px solid #ccc !important; padding: 4px 6px !important; text-align: left !important; font-weight: 700 !important; font-size: 7px !important; text-transform: uppercase !important; }
                .print-table td { border: 1px solid #ccc !important; padding: 3px 6px !important; font-size: 8px !important; }
                .print-table tr:nth-child(even) { background: #f9f9f9 !important; }
                .print-footer { text-align: center !important; font-size: 8px !important; color: #999 !important; border-top: 1px solid #ddd !important; padding-top: 8px !important; margin-top: 16px !important; }
                @page { margin: 12mm; size: A4 portrait; }
                .no-print { display: none !important; }
                .print-area { display: block !important; }
            </style>
        </head>
        <body>
            <div class="print-area">
                <div class="print-header">
                    <div class="print-header-text">
                        <h1>Opol Community College</h1>
                        <div class="subtitle">Election Transparency Report</div>
                        <div class="meta">Generated: ${new Date().toLocaleString()}</div>
                    </div>
                </div>

                <div class="print-report-title">
                    <h2>Transparency & Audit Report</h2>
                    <div class="election-name">${electionTitle}</div>
                </div>

                <div class="print-stats-grid">
                    <div class="print-stat-card">
                        <div class="label">Total Logs</div>
                        <div class="value">${allAuditLogs.length}</div>
                    </div>
                    <div class="print-stat-card">
                        <div class="label">Vote Events</div>
                        <div class="value">${allAuditLogs.filter((l) => isVoteAction(l.action_type)).length}</div>
                    </div>
                    <div class="print-stat-card">
                        <div class="label">Unique Users</div>
                        <div class="value">${new Set(allAuditLogs.map((l) => l.user_id)).size}</div>
                    </div>
                    <div class="print-stat-card">
                        <div class="label">Action Types</div>
                        <div class="value">${availableActions.length}</div>
                    </div>
                </div>

                <h3 style="margin: 14px 0 6px 0; font-size: 13px; border-bottom: 2px solid #1a1a1a; padding-bottom: 4px;">Recent Activities (${printLogs.length} of ${filteredLogs.length} shown)</h3>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Target</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${printLogs
                            .map((log) => {
                                const actionConfig = getActionConfig(
                                    log.action_type,
                                );
                                const targetInfo = getTargetTableInfo(
                                    log.target_table,
                                );
                                return `
                            <tr>
                                <td style="font-size:7px;">${new Date(log.timestamp).toLocaleString()}</td>
                                <td>${log.user?.first_name || ""} ${log.user?.last_name || ""}</td>
                                <td>${actionConfig.label}</td>
                                <td>${targetInfo.label}${log.target_id ? ` #${log.target_id}` : ""}</td>
                            </tr>
                        `;
                            })
                            .join("")}
                    </tbody>
                </table>

                <div class="print-footer">
                    This is a system-generated transparency report from the OCC Election System.<br>
                    © ${new Date().getFullYear()} Opol Community College. All rights reserved.
                </div>
            </div>
            <script>
                window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
            </script>
        </body>
        </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const voteLogs = allAuditLogs.filter((log) =>
        isVoteAction(log.action_type),
    );
    const voteCount = voteLogs.length;
    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

    if (loading && !allAuditLogs.length) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <style>{printStyles}</style>

            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 via-indigo-600 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Transparency & Audit
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                Audit Trail
                            </h1>
                            <p className="text-blue-100 mt-1">
                                Monitor system activities, votes, and user
                                actions with full transparency
                            </p>
                        </div>
                        <div className="flex gap-2 no-print">
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
                                onClick={handlePrint}
                                className="bg-white text-blue-600 hover:bg-gray-100"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Report
                            </Button>
                            <Button
                                size="sm"
                                onClick={exportToCSV}
                                className="bg-white text-blue-600 hover:bg-gray-100"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats - Pill Style */}
            <div className="flex flex-wrap items-center gap-3 py-1 no-print">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Total Logs
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {allAuditLogs.length}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <Vote className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        Votes Logged
                    </span>
                    <span className="text-sm font-bold text-green-800">
                        {voteCount}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                        Action Types
                    </span>
                    <span className="text-sm font-bold text-purple-800">
                        {availableActions.length}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">
                        Users
                    </span>
                    <span className="text-sm font-bold text-orange-800">
                        {new Set(allAuditLogs.map((l) => l.user_id)).size}
                    </span>
                </div>
            </div>

            {/* Audit Stats */}
            {auditStats && (
                <div className="flex flex-wrap items-center gap-3 py-1 no-print">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                            Today
                        </span>
                        <span className="text-sm font-bold text-blue-800">
                            {auditStats.today || 0}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            Last Hour
                        </span>
                        <span className="text-sm font-bold text-green-800">
                            {auditStats.last_hour || 0}
                        </span>
                    </div>
                </div>
            )}

            {/* Election Selector with "All Elections" option */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm no-print">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Select Election (or view all)
                        </h3>
                    </div>
                </div>
                <div className="p-5">
                    <div className="flex flex-col md:flex-row gap-4">
                        <select
                            className="w-full md:w-96 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            value={selectedElection}
                            onChange={(e) => {
                                setSelectedElection(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">All Elections (All Logs)</option>
                            {elections.map((election) => (
                                <option
                                    key={election.election_id}
                                    value={election.election_id}
                                >
                                    {election.title}
                                </option>
                            ))}
                        </select>
                        {selectedElection && (
                            <Badge className="bg-blue-100 text-blue-700">
                                Filtering by:{" "}
                                {elections.find(
                                    (e) =>
                                        e.election_id.toString() ===
                                        selectedElection,
                                )?.title || selectedElection}
                            </Badge>
                        )}
                        {!selectedElection && (
                            <Badge className="bg-green-100 text-green-700">
                                Showing All Logs
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm no-print">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                            Filters
                        </h3>
                    </div>
                </div>
                <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search by user, action, or table..."
                                className="pl-10 rounded-xl bg-gray-50 border-gray-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <select
                                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                value={actionFilter}
                                onChange={(e) =>
                                    setActionFilter(e.target.value)
                                }
                            >
                                <option value="all">
                                    All Actions ({allAuditLogs.length})
                                </option>
                                {availableActions.map((action) => {
                                    const config = getActionConfig(action);
                                    const count = allAuditLogs.filter(
                                        (log) => log.action_type === action,
                                    ).length;
                                    return (
                                        <option key={action} value={action}>
                                            {config.label} ({count})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div>
                            <select
                                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                value={targetFilter}
                                onChange={(e) =>
                                    setTargetFilter(e.target.value)
                                }
                            >
                                <option value="all">All Targets</option>
                                {availableTargets.map((target) => {
                                    const info = getTargetTableInfo(target);
                                    const count = allAuditLogs.filter(
                                        (log) => log.target_table === target,
                                    ).length;
                                    return (
                                        <option key={target} value={target}>
                                            {info.label} ({count})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-900">
                                System Activity Log ({filteredLogs.length}{" "}
                                records)
                            </h3>
                        </div>
                        <span className="text-sm font-normal text-gray-500 no-print">
                            Showing {displayLogs.length} of{" "}
                            {filteredLogs.length} logs (Page {currentPage} of{" "}
                            {totalPages})
                        </span>
                    </div>
                </div>

                {displayLogs.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-4 text-left font-semibold text-gray-700">
                                            Timestamp
                                        </th>
                                        <th className="p-4 text-left font-semibold text-gray-700">
                                            User
                                        </th>
                                        <th className="p-4 text-left font-semibold text-gray-700">
                                            Action
                                        </th>
                                        <th className="p-4 text-left font-semibold text-gray-700">
                                            Target
                                        </th>
                                        <th className="p-4 text-left font-semibold text-gray-700">
                                            IP Address
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {displayLogs.map((log, idx) => {
                                        const actionConfig = getActionConfig(
                                            log.action_type,
                                        );
                                        const ActionIcon = actionConfig.icon;
                                        const targetInfo = getTargetTableInfo(
                                            log.target_table,
                                        );
                                        const TargetIcon = targetInfo.icon;
                                        const isVote = isVoteAction(
                                            log.action_type,
                                        );

                                        return (
                                            <tr
                                                key={log.log_id}
                                                className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                                            >
                                                <td className="p-4 text-gray-600 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="text-sm">
                                                            {new Date(
                                                                log.timestamp,
                                                            ).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                            {
                                                                log.user
                                                                    ?.first_name?.[0]
                                                            }
                                                            {
                                                                log.user
                                                                    ?.last_name?.[0]
                                                            }
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {
                                                                    log.user
                                                                        ?.first_name
                                                                }{" "}
                                                                {
                                                                    log.user
                                                                        ?.last_name
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {
                                                                    log.user
                                                                        ?.email
                                                                }
                                                                {log.user
                                                                    ?.role && (
                                                                    <span className="ml-2 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                                                                        {
                                                                            log
                                                                                .user
                                                                                .role
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={`${actionConfig.color} border px-3 py-1 text-xs font-medium flex items-center gap-1`}
                                                        >
                                                            <ActionIcon className="w-3 h-3" />
                                                            <span>
                                                                {
                                                                    actionConfig.label
                                                                }
                                                            </span>
                                                            {isVote && (
                                                                <span className="ml-1 text-green-600">
                                                                    🗳️
                                                                </span>
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={`${targetInfo.color} border-0 text-xs font-medium flex items-center gap-1`}
                                                        >
                                                            <TargetIcon className="w-3 h-3" />
                                                            <span>
                                                                {
                                                                    targetInfo.label
                                                                }
                                                            </span>
                                                            {log.target_id && (
                                                                <span className="text-gray-400 text-[10px]">
                                                                    #
                                                                    {
                                                                        log.target_id
                                                                    }
                                                                </span>
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-gray-500">
                                                    {log.ip_address || "-"}
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
                                    {filteredLogs.length} logs)
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
                    </>
                ) : (
                    <div className="text-center py-16 no-print">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">
                            No audit logs found
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchTerm
                                ? "Try adjusting your search criteria"
                                : "Select a different election"}
                        </p>
                        {searchTerm && (
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setSearchTerm("")}
                            >
                                Clear Search
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4 no-print">
                <Shield className="w-3 h-3 inline mr-1" />
                All actions are logged and immutable for security and
                transparency compliance
                <span className="mx-2">•</span>
                <span>Total Logs: {allAuditLogs.length}</span>
                <span className="mx-2">•</span>
                <span>{voteCount} vote events logged</span>
                <span className="mx-2">•</span>
                <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
        </div>
    );
};

export default MonitoringAudit;
