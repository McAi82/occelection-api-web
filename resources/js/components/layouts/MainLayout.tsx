// resources/js/components/layouts/MainLayout.tsx
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import NotificationCenter from "../common/NotificationCenter";
import {
    LayoutDashboard,
    Calendar,
    Clock,
    Users,
    Settings,
    LogOut,
    ChevronDown,
    Shield,
    User,
    FileText,
    BarChart3,
    MessageCircle,
    Building2,
    Award,
    Eye,
    Activity,
    UserPlus,
    FolderOpen,
    TrendingUp,
    Scale,
    Menu,
    X,
    Bell,
    ChevronLeft,
    ChevronRight,
    Download,
    FileCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import occLogo from "../../assets/occlogo.jpg";

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path?: string;
    subItems?: NavItem[];
    isParent?: boolean;
    badge?: string;
    divider?: boolean;
}

// ✅ Color themes for each parent dropdown group
const GROUP_COLORS: Record<
    string,
    {
        bg: string;
        border: string;
        hover: string;
        headerBg: string;
        iconBg: string;
    }
> = {
    "candidates-info": {
        bg: "bg-sky-50",
        border: "border-sky-300",
        hover: "hover:bg-sky-100/70",
        headerBg: "bg-sky-50/60",
        iconBg: "bg-sky-100 text-sky-600",
    },
    "comelec-management": {
        bg: "bg-sky-50",
        border: "border-sky-300",
        hover: "hover:bg-sky-100/70",
        headerBg: "bg-sky-50/60",
        iconBg: "bg-sky-100 text-sky-600",
    },
    "election-management": {
        bg: "bg-sky-50",
        border: "border-sky-300",
        hover: "hover:bg-sky-100/70",
        headerBg: "bg-sky-50/60",
        iconBg: "bg-sky-100 text-sky-600",
    },
    "voter-mgmt": {
        bg: "bg-sky-50",
        border: "border-sky-300",
        hover: "hover:bg-sky-100/70",
        headerBg: "bg-sky-50/60",
        iconBg: "bg-sky-100 text-sky-600",
    },
    "user-management": {
        bg: "bg-sky-50",
        border: "border-sky-300",
        hover: "hover:bg-sky-100/70",
        headerBg: "bg-sky-50/60",
        iconBg: "bg-sky-100 text-sky-600",
    },
    reports: {
        bg: "bg-sky-50",
        border: "border-sky-300",
        hover: "hover:bg-sky-100/70",
        headerBg: "bg-sky-50/60",
        iconBg: "bg-sky-100 text-sky-600",
    },
    monitor: {
        bg: "bg-sky-50",
        border: "border-sky-300",
        hover: "hover:bg-sky-100/70",
        headerBg: "bg-sky-50/60",
        iconBg: "bg-sky-100 text-sky-600",
    },
    candidacy: {
        bg: "bg-sky-50",
        border: "border-sky-300",
        hover: "hover:bg-sky-100/70",
        headerBg: "bg-sky-50/60",
        iconBg: "bg-sky-100 text-sky-600",
    },
};

const DEFAULT_GROUP_COLOR = {
    bg: "bg-blue-50",
    border: "border-blue-300",
    hover: "hover:bg-blue-100/70",
    headerBg: "bg-blue-50/60",
    iconBg: "bg-blue-100 text-blue-600",
};

const getGroupColor = (id: string) => GROUP_COLORS[id] || DEFAULT_GROUP_COLOR;

const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // ✅ Two separate states:
    // - isPinned: user manually locked it open (via toggle button)
    // - isHovered: mouse is currently over the sidebar
    // The sidebar is expanded if (isPinned || isHovered)
    const [isPinned, setIsPinned] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // ✅ Computed: should sidebar show full content?
    const collapsed = !isPinned && !isHovered;

    // ✅ Close the mobile drawer on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const getPageTitle = (): string => {
        const path = location.pathname;
        if (path === "/" || path === "/dashboard") return "Dashboard";

        if (path === "/admin" || path === "/admin/dashboard")
            return "Dashboard";
        if (path.includes("/admin/elections")) return "Elections";
        if (path.includes("/admin/voters")) return "Voter Management";
        if (path.includes("/admin/reports")) return "Reports & Analytics";
        if (path.includes("/admin/applications"))
            return "Candidacy Applications";
        if (path.includes("/admin/schedule-requests"))
            return "Schedule Requests";
        if (path.includes("/admin/users")) return "User Management";
        if (path.includes("/admin/records")) return "Election Records";
        if (path.includes("/admin/monitoring")) return "Monitoring";
        if (path.includes("/admin/face-registration"))
            return "Face Registration";
        if (path.includes("/admin/partylists")) return "Partylist Management";
        if (path.includes("/admin/positions")) return "Position Management";
        if (path.includes("/admin/campaign-schedule"))
            return "Campaign Schedule";
        if (path.includes("/admin/candidacy-records"))
            return "Candidacy Records";
        if (path.includes("/admin/candidates")) return "Manage Candidates";

        if (path.includes("/comelec/candidates")) return "Candidate Management";
        if (path.includes("/comelec/campaign-schedule"))
            return "Campaign Schedule";
        if (path.includes("/comelec/schedule-requests"))
            return "Schedule Requests";

        if (path.includes("/candidate/schedule-request"))
            return "Schedule Request";

        if (path.includes("/elections")) return "Elections";
        if (path.includes("/candidates")) return "Candidates";
        if (path.includes("/candidate-comparison"))
            return "Candidate Comparison";
        if (path.includes("/partylists")) return "Partylists";
        if (path.includes("/timeline")) return "Campaign Timeline";
        if (path.includes("/candidate-timeline")) return "Candidate Timeline";
        if (path.includes("/apply-candidacy")) return "Apply for Candidacy";
        if (path.includes("/my-applications")) return "My Applications";
        if (path.includes("/profile")) return "Profile Settings";
        if (path.includes("/feedback")) return "Feedback";
        if (path.includes("/moderate/comments")) return "Comment Moderation";
        if (path.includes("/monitoring")) return "Monitoring";
        if (path.includes("/download-app")) return "Download App";
        if (path.includes("/notifications")) return "Notifications";

        return "Dashboard";
    };

    const getNavItems = (): NavItem[] => {
        const role = user?.role || "voter";
        const items: NavItem[] = [];

        items.push({
            id: "dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/dashboard",
        });

        items.push({
            id: "elections",
            label: "Elections",
            icon: Calendar,
            path: "/elections",
        });

        items.push({
            id: "timeline",
            label: "Timeline",
            icon: MessageCircle,
            path: "/timeline",
        });

        if (role === "candidate") {
            items.push({
                id: "schedule-request",
                label: "Schedule Request",
                icon: Clock,
                path: "/candidate/schedule-request",
            });
            items.push({
                id: "my-applications",
                label: "My Applications",
                icon: FileCheck,
                path: "/my-applications",
            });
            items.push({
                id: "partylist-requests",
                label: "Partylist Requests",
                icon: Users,
                path: "/candidate/partylist-requests",
            });
        }

        items.push({
            id: "notifications",
            label: "Notifications",
            icon: Bell,
            path: "/notifications",
        });

        if (role === "admin") {
            items.push({
                id: "schedule-requests",
                label: "Schedule Requests",
                icon: Calendar,
                path: "/admin/schedule-requests",
            });
        }

        if (role === "voter") {
            items.push({
                id: "my-applications",
                label: "My Applications",
                icon: FileCheck,
                path: "/my-applications",
            });
        }

        items.push({
            id: "candidates-info",
            label: "Candidates Info",
            icon: Users,
            subItems: [
                {
                    id: "candidates",
                    label: "Candidates",
                    icon: Users,
                    path: "/candidates",
                },
                {
                    id: "compare",
                    label: "Compare",
                    icon: Scale,
                    path: "/candidate-comparison",
                },
                {
                    id: "partylists",
                    label: "Partylists",
                    icon: Building2,
                    path: "/partylists",
                },
            ],
        });

        if (role === "comelec") {
            items.push({
                id: "comelec-management",
                label: "Election Management",
                icon: Settings,
                isParent: true,
                badge: "COMELEC",
                subItems: [
                    {
                        id: "comelec-candidates",
                        label: "Candidates",
                        icon: Users,
                        path: "/comelec/candidates",
                    },
                    {
                        id: "comelec-campaign",
                        label: "Campaign Schedule",
                        icon: Calendar,
                        path: "/comelec/campaign-schedule",
                    },
                    {
                        id: "comelec-schedule-requests",
                        label: "Schedule Requests",
                        icon: Clock,
                        path: "/comelec/schedule-requests",
                    },
                    {
                        id: "comelec-moderation",
                        label: "Moderate Comments",
                        icon: MessageCircle,
                        path: "/moderate/comments",
                    },
                ],
            });
        }

        if (role === "comelec") {
            items.push({
                id: "comelec-monitoring",
                label: "Monitoring",
                icon: Activity,
                isParent: true,
                subItems: [
                    {
                        id: "comelec-monitor-dashboard",
                        label: "Live Dashboard",
                        icon: LayoutDashboard,
                        path: "/monitoring/live-dashboard",
                    },
                    {
                        id: "comelec-monitor-results",
                        label: "Live Results",
                        icon: Eye,
                        path: "/monitoring/results",
                    },
                    {
                        id: "comelec-monitor-turnout",
                        label: "Voter Turnout",
                        icon: TrendingUp,
                        path: "/monitoring/turnout",
                    },
                    {
                        id: "comelec-monitor-audit",
                        label: "Audit Trail",
                        icon: Shield,
                        path: "/monitoring/audit",
                    },
                ],
            });
        }

        if (role === "admin") {
            items.push({
                id: "election-management",
                label: "Election Management",
                icon: Settings,
                isParent: true,
                badge: "Admin",
                subItems: [
                    {
                        id: "admin-elections",
                        label: "Elections",
                        icon: Calendar,
                        path: "/admin/elections",
                    },
                    {
                        id: "admin-positions",
                        label: "Positions",
                        icon: Award,
                        path: "/admin/positions",
                    },
                    {
                        id: "admin-campaign-schedule",
                        label: "Campaign Schedule",
                        icon: Clock,
                        path: "/admin/campaign-schedule",
                    },
                    {
                        id: "moderate-comments",
                        label: "Moderate Comments",
                        icon: MessageCircle,
                        path: "/moderate/comments",
                    },
                ],
            });

            items.push({
                id: "candidacy",
                label: "Candidacy",
                icon: FileText,
                isParent: true,
                subItems: [
                    {
                        id: "candidacy-applications",
                        label: "Candidacy Applications",
                        icon: FileText,
                        path: "/admin/applications",
                    },
                    {
                        id: "candidacy-records",
                        label: "Candidacy Records",
                        icon: FolderOpen,
                        path: "/admin/candidacy-records",
                    },
                ],
            });

            items.push({
                id: "voter-mgmt",
                label: "Voter Management",
                icon: UserPlus,
                isParent: true,
                subItems: [
                    {
                        id: "import-voters",
                        label: "Import Voters",
                        icon: FileText,
                        path: "/admin/import-voters",
                    },
                    {
                        id: "voter-list",
                        label: "Voter List",
                        icon: Users,
                        path: "/admin/voters",
                    },
                ],
            });

            items.push({
                id: "user-management",
                label: "User Management",
                icon: Users,
                isParent: true,
                subItems: [
                    {
                        id: "users-list",
                        label: "View All Users",
                        icon: Users,
                        path: "/admin/users/list",
                    },
                    {
                        id: "create-user",
                        label: "Create COMELEC User",
                        icon: UserPlus,
                        path: "/admin/users/create",
                    },
                    {
                        id: "face-registration",
                        label: "Face Registration",
                        icon: Shield,
                        path: "/admin/face-registration",
                    },
                ],
            });

            items.push({
                id: "reports",
                label: "Reports & Analytics",
                icon: BarChart3,
                isParent: true,
                subItems: [
                    {
                        id: "election-records",
                        label: "Election Records",
                        icon: FolderOpen,
                        path: "/admin/records",
                    },
                    {
                        id: "election-reports",
                        label: "Election Reports",
                        icon: FileText,
                        path: "/admin/reports",
                    },
                ],
            });

            items.push({
                id: "monitor",
                label: "Monitoring",
                icon: Activity,
                isParent: true,
                subItems: [
                    {
                        id: "admin-monitor-dashboard",
                        label: "Live Dashboard",
                        icon: LayoutDashboard,
                        path: "/admin/monitoring/live-dashboard",
                    },
                    {
                        id: "admin-monitor-results",
                        label: "Live Results",
                        icon: Eye,
                        path: "/admin/monitoring/results",
                    },
                    {
                        id: "admin-monitor-turnout",
                        label: "Voter Turnout",
                        icon: TrendingUp,
                        path: "/admin/monitoring/turnout",
                    },
                    {
                        id: "admin-monitor-audit",
                        label: "Audit Trail",
                        icon: Shield,
                        path: "/admin/monitoring/audit",
                    },
                ],
            });
        }

        if (role !== "admin") {
            items.push({
                id: "feedback",
                label: "Feedback",
                icon: MessageCircle,
                path: "/feedback",
            });
        }

        if (role !== "admin") {
            items.push({
                id: "download-app",
                label: "Download App",
                icon: Download,
                path: "/download-app",
            });
        }

        return items;
    };

    const navItems = getNavItems();

    const toggleExpand = (id: string) => {
        setExpandedItems((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        );
    };

    const isActive = (path?: string): boolean => {
        if (!path) return false;
        if (path === "/dashboard" && location.pathname === "/dashboard")
            return true;
        if (path === "/admin" && location.pathname === "/admin") return true;
        if (
            path === "/admin/dashboard" &&
            location.pathname === "/admin/dashboard"
        )
            return true;

        if (
            path !== "/dashboard" &&
            path !== "/admin" &&
            path !== "/admin/dashboard"
        ) {
            if (location.pathname.startsWith(path)) return true;
        }

        return location.pathname === path;
    };

    const renderNavItem = (item: NavItem, depth: number = 0) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedItems.includes(item.id);
        const active = isActive(item.path);
        const isParent = item.isParent;
        const groupColor = getGroupColor(item.id);

        if (item.divider) {
            return (
                <div
                    key={item.id}
                    className={`${collapsed ? "my-2" : "my-3"} border-t border-gray-200`}
                />
            );
        }

        return (
            <div key={item.id} className="relative group">
                <div
                    className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                        ${active ? "bg-blue-600 text-white shadow-md" : `text-gray-600 ${groupColor.hover}`}
                        ${!active && hasSubItems && isExpanded && !collapsed ? groupColor.headerBg : ""}
                        ${depth > 0 ? "ml-3" : ""}
                        ${collapsed && depth === 0 ? "justify-center px-2" : ""}
                    `}
                    onClick={() => {
                        if (hasSubItems) {
                            toggleExpand(item.id);
                        } else if (item.path) {
                            navigate(item.path);
                            setMobileOpen(false);
                        }
                    }}
                >
                    <item.icon
                        className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-gray-500"} transition-transform duration-200 group-hover:scale-110`}
                    />
                    {!collapsed && (
                        <>
                            <span
                                className={`text-sm font-semibold ${active ? "text-white" : "text-gray-700"}`}
                            >
                                {item.label}
                            </span>
                            {hasSubItems && (
                                <ChevronDown
                                    className={`w-3.5 h-3.5 ml-auto transition-transform duration-300 ease-in-out ${
                                        isExpanded ? "rotate-180" : "rotate-0"
                                    } ${active ? "text-white" : "text-gray-400"}`}
                                />
                            )}
                            {isParent && item.badge && (
                                <Badge
                                    className={`ml-auto text-[10px] ${active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"} px-1.5 py-0.5`}
                                >
                                    {item.badge}
                                </Badge>
                            )}
                        </>
                    )}
                    {collapsed && hasSubItems && (
                        <div
                            className={`absolute left-full top-0 ml-2 ${groupColor.bg} shadow-2xl rounded-2xl p-2 min-w-[220px] z-50 hidden group-hover:block border ${groupColor.border} animate-in fade-in slide-in-from-left-2 duration-200`}
                        >
                            <div
                                className={`p-2 ${groupColor.headerBg} rounded-xl mb-1`}
                            >
                                <p className="text-xs font-semibold text-gray-700">
                                    {item.label}
                                </p>
                            </div>
                            <div className="space-y-0.5">
                                {item.subItems!.map((subItem) =>
                                    renderNavItem(subItem, 1),
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {hasSubItems && !collapsed && (
                    <div
                        className={`
                            ml-3 border-l-2 ${groupColor.border} rounded-r-xl
                            transition-all duration-300 ease-in-out
                            overflow-hidden
                            ${
                                isExpanded
                                    ? `max-h-[500px] opacity-100 mt-1 pl-2 py-1.5 pr-1.5 ${groupColor.bg}`
                                    : "max-h-0 opacity-0 mt-0 pl-2 py-0 pr-1.5"
                            }
                        `}
                    >
                        <div className="space-y-0.5">
                            {item.subItems!.map((subItem) =>
                                renderNavItem(subItem, depth + 1),
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderMobileNavItem = (item: NavItem, depth: number = 0) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedItems.includes(item.id);
        const active = isActive(item.path);
        const groupColor = getGroupColor(item.id);

        if (item.divider) {
            return (
                <div key={item.id} className="my-3 border-t border-gray-200" />
            );
        }

        return (
            <div key={item.id}>
                <div
                    className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all
                        ${active ? "bg-blue-600 text-white shadow-md" : `text-gray-600 ${groupColor.hover}`}
                        ${!active && hasSubItems && isExpanded ? groupColor.headerBg : ""}
                        ${depth > 0 ? "ml-3" : ""}
                    `}
                    onClick={() => {
                        if (hasSubItems) {
                            toggleExpand(item.id);
                        } else if (item.path) {
                            navigate(item.path);
                            setMobileOpen(false);
                        }
                    }}
                >
                    <item.icon
                        className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-gray-500"}`}
                    />
                    <span
                        className={`text-sm font-semibold ${active ? "text-white" : "text-gray-700"}`}
                    >
                        {item.label}
                    </span>
                    {hasSubItems && (
                        <ChevronDown
                            className={`w-3.5 h-3.5 ml-auto transition-transform duration-300 ease-in-out ${
                                isExpanded ? "rotate-180" : "rotate-0"
                            } ${active ? "text-white" : "text-gray-400"}`}
                        />
                    )}
                    {item.isParent && item.badge && (
                        <Badge
                            className={`ml-auto text-[10px] ${active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"} px-1.5 py-0.5`}
                        >
                            {item.badge}
                        </Badge>
                    )}
                </div>
                {hasSubItems && (
                    <div
                        className={`
                            ml-4 border-l-2 ${groupColor.border} rounded-r-xl
                            transition-all duration-300 ease-in-out
                            overflow-hidden
                            ${
                                isExpanded
                                    ? `max-h-[500px] opacity-100 mt-1 pl-2 py-1.5 pr-1.5 ${groupColor.bg}`
                                    : "max-h-0 opacity-0 mt-0 pl-2 py-0 pr-1.5"
                            }
                        `}
                    >
                        <div className="space-y-0.5">
                            {item.subItems!.map((subItem) =>
                                renderMobileNavItem(subItem, depth + 1),
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const getInitials = (): string => {
        if (!user) return "U";
        return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
    };

    const getImageUrl = (path?: string): string | null => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        if (path.startsWith("/storage")) return path;
        return `https://occelection-api-web-production.up.railway.app/${path}`;
    };

    const getRoleLabel = (): string => {
        const role = user?.role || "voter";
        const map: Record<string, string> = {
            admin: "Administrator",
            comel: "COMELEC Officer",
            candidate: "Candidate",
            voter: "Student Voter",
        };
        return map[role] || "User";
    };

    const getRoleBadgeColor = (): string => {
        const role = user?.role || "voter";
        const map: Record<string, string> = {
            admin: "bg-purple-100 text-purple-700",
            comel: "bg-blue-100 text-blue-700",
            candidate: "bg-green-100 text-green-700",
            voter: "bg-gray-100 text-gray-700",
        };
        return map[role] || "bg-gray-100 text-gray-700";
    };

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* ===== SPACER: reserves horizontal space for the fixed sidebar ===== */}
            <div
                className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${
                    collapsed ? "w-16" : "w-64"
                }`}
                aria-hidden="true"
            />

            {/* ===== SIDEBAR (fixed, hover-expandable) ===== */}
            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                    fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200
                    transition-[width] duration-300 ease-in-out
                    hidden lg:flex lg:flex-col
                    shadow-xl
                    ${collapsed ? "w-16" : "w-64"}
                `}
            >
                {/* ✅ Sidebar Header with Pin Button */}
                <div
                    className={`flex items-center border-b border-gray-100 ${
                        collapsed
                            ? "justify-center px-2 py-4"
                            : "justify-between px-3 py-4"
                    }`}
                >
                    <div
                        className={`flex items-center gap-2.5 ${
                            collapsed ? "justify-center" : ""
                        }`}
                    >
                        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg flex-shrink-0 ring-2 ring-blue-100">
                            <img
                                src={occLogo}
                                alt="OCC Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden">
                                <div className="text-sm font-extrabold text-gray-900 leading-tight tracking-tight whitespace-nowrap">
                                    OCC Election System
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <div className="text-[10px] font-semibold text-gray-400 whitespace-nowrap">
                                        {user?.role === "admin"
                                            ? "Administrator Portal"
                                            : user?.role === "comelec"
                                              ? "COMELEC Portal"
                                              : user?.role === "candidate"
                                                ? "Candidate Portal"
                                                : "Voter Portal"}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ Pin toggle — pins sidebar open/closed */}
                    {!collapsed && (
                        <button
                            onClick={() => setIsPinned((p) => !p)}
                            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                                isPinned
                                    ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                    : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            }`}
                            title={
                                isPinned
                                    ? "Unpin sidebar (auto-collapse)"
                                    : "Pin sidebar open"
                            }
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Scrollable nav area */}
                <ScrollArea className="flex-1 px-2.5 py-3">
                    <div className="space-y-0.5">
                        {navItems.map((item) => renderNavItem(item))}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div
                    className={`border-t border-gray-100 bg-white/80 backdrop-blur-sm ${
                        collapsed ? "flex justify-center p-3" : "p-3"
                    }`}
                >
                    {!collapsed ? (
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 font-medium">
                                    Version 2.0
                                </p>
                                <p className="text-[10px] text-gray-300">
                                    © 2026 OCC
                                </p>
                            </div>
                            {isPinned && (
                                <Badge className="text-[9px] bg-blue-100 text-blue-700 border-0 px-1.5 py-0.5">
                                    Pinned
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <p className="text-[8px] text-gray-400">v2.0</p>
                        </div>
                    )}
                </div>

                {/* ✅ Pin toggle also shown when collapsed (to pin open) */}
                {collapsed && isHovered && (
                    <button
                        onClick={() => setIsPinned(true)}
                        className="absolute top-4 right-2 p-1 rounded-md bg-white shadow-md border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        title="Pin sidebar open"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                )}
            </aside>

            {/* ===== MOBILE OVERLAY ===== */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ===== MOBILE SIDEBAR ===== */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200
                    transition-transform duration-300 lg:hidden
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                    w-72 shadow-2xl
                `}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-blue-50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg ring-2 ring-blue-100">
                                <img
                                    src={occLogo}
                                    alt="OCC Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <div className="text-sm font-extrabold text-gray-900 leading-tight">
                                    OCC Election System
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <div className="text-[10px] font-semibold text-gray-400">
                                        {user?.role === "admin"
                                            ? "Administrator Portal"
                                            : user?.role === "comelec"
                                              ? "COMELEC Portal"
                                              : user?.role === "candidate"
                                                ? "Candidate Portal"
                                                : "Voter Portal"}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <ScrollArea className="flex-1 px-3 py-3">
                        <div className="space-y-0.5">
                            {navItems.map((item) => renderMobileNavItem(item))}
                        </div>
                    </ScrollArea>

                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white shadow-sm">
                            <Avatar className="w-10 h-10 ring-2 ring-blue-100">
                                <AvatarImage
                                    src={
                                        getImageUrl(
                                            user?.face_reference_photo,
                                        ) || undefined
                                    }
                                />
                                <AvatarFallback className="bg-blue-500 text-white text-sm font-bold">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <Badge
                                    className={`${getRoleBadgeColor()} text-[10px] px-2 py-0.5`}
                                >
                                    {getRoleLabel()}
                                </Badge>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="flex-1 min-w-0 flex flex-col">
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="p-2 rounded-xl hover:bg-gray-100 lg:hidden transition-colors"
                            >
                                <Menu className="w-5 h-5 text-gray-600" />
                            </button>

                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                                    {getPageTitle()}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <NotificationCenter />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all duration-200 group shadow-sm">
                                        <Avatar className="w-9 h-9 ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all">
                                            <AvatarImage
                                                src={
                                                    getImageUrl(
                                                        user?.face_reference_photo,
                                                    ) || undefined
                                                }
                                            />
                                            <AvatarFallback className="bg-blue-500 text-white text-sm font-bold">
                                                {getInitials()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="hidden sm:block">
                                            <p className="text-sm font-bold text-gray-900 leading-tight">
                                                {user?.first_name || "User"}
                                            </p>
                                            <Badge
                                                className={`${getRoleBadgeColor()} text-[10px] px-2 py-0.5`}
                                            >
                                                {getRoleLabel()}
                                            </Badge>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56 rounded-2xl shadow-2xl border-0 p-1 overflow-hidden"
                                >
                                    <div className="px-4 py-3 bg-blue-50 rounded-xl mb-1">
                                        <p className="text-xs font-medium text-gray-500">
                                            Signed in as
                                        </p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {user?.first_name} {user?.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {user?.email}
                                        </p>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => navigate("/profile")}
                                        className="cursor-pointer rounded-xl hover:bg-gray-50 transition-colors px-3 py-2"
                                    >
                                        <User className="w-4 h-4 mr-2 text-gray-500" />
                                        <span>Profile Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => navigate("/dashboard")}
                                        className="cursor-pointer rounded-xl hover:bg-gray-50 transition-colors px-3 py-2"
                                    >
                                        <LayoutDashboard className="w-4 h-4 mr-2 text-gray-500" />
                                        <span>Dashboard</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="cursor-pointer rounded-xl text-red-600 hover:bg-red-50 transition-colors px-3 py-2"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
