// resources/js/pages/NotificationsPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { notificationAPI } from "../api/notifications";
import type { Notification } from "../api/notifications";
import {
    Bell,
    Vote,
    UserCheck,
    Calendar,
    MessageCircle,
    AlertCircle,
    CheckCircle,
    Trash2,
    Loader2,
    Check,
    Filter,
    Clock,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    CheckSquare,
    Square,
    RefreshCw,
} from "lucide-react";

const getNotificationIcon = (type: string) => {
    switch (type) {
        case "vote_confirmation":
            return <Vote className="w-4 h-4 text-green-500" />;
        case "candidate_approval":
            return <UserCheck className="w-4 h-4 text-blue-500" />;
        case "election_reminder":
            return <Calendar className="w-4 h-4 text-orange-500" />;
        case "feedback_response":
            return <MessageCircle className="w-4 h-4 text-purple-500" />;
        default:
            return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
};

// Polling interval
const POLL_INTERVAL_MS = 15_000;
const HIDDEN_MULTIPLIER = 4;

const NotificationsPage: React.FC = () => {
    const { user } = useAuth();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const [selectAll, setSelectAll] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const lastSeenIdRef = React.useRef<number>(0);

    // ---------- Full fetch (used at mount and on manual refresh) ----------
    const fetchNotifications = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [notifResponse, countResponse] = await Promise.all([
                notificationAPI.getAll(),
                notificationAPI.getUnreadCount(),
            ]);

            let data: Notification[] = [];
            if (notifResponse.data) {
                if (Array.isArray(notifResponse.data)) {
                    data = notifResponse.data;
                } else if (notifResponse.data.data && Array.isArray(notifResponse.data.data)) {
                    data = notifResponse.data.data;
                }
            }

            setNotifications(data);

            if (data.length > 0) {
                lastSeenIdRef.current = Math.max(...data.map((n) => n.notification_id));
            }

            let unread = 0;
            if (countResponse.data) {
                if (typeof countResponse.data === "number") unread = countResponse.data;
                else if (countResponse.data.unread_count !== undefined) unread = countResponse.data.unread_count;
            }
            setUnreadCount(unread);
            setLastRefresh(new Date());
        } catch (error) {
            console.error("❌ Failed to fetch notifications:", error);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    // ---------- Poll for new notifications ----------
    const pollForNew = async () => {
        if (!user) return;
        try {
            const response = await notificationAPI.poll(lastSeenIdRef.current);
            const newNotifs = response.data.notifications || [];

            if (newNotifs.length > 0) {
                setNotifications((prev) => {
                    const existing = new Set(prev.map((n) => n.notification_id));
                    const toAdd = newNotifs.filter((n) => !existing.has(n.notification_id));
                    return [...toAdd, ...prev];
                });
                lastSeenIdRef.current = Math.max(
                    lastSeenIdRef.current,
                    response.data.latest_id,
                );
            }

            setUnreadCount(response.data.unread_count);
            setLastRefresh(new Date());
        } catch (error) {
            console.warn("⚠️ Poll failed");
        }
    };

    // ---------- Initial fetch ----------
    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    // ---------- Polling scheduler ----------
    useEffect(() => {
        if (!user) return;
        const tick = async () => {
            await pollForNew();
            const interval = document.hidden
                ? POLL_INTERVAL_MS * HIDDEN_MULTIPLIER
                : POLL_INTERVAL_MS;
            timer = setTimeout(tick, interval);
        };
        let timer = setTimeout(tick, POLL_INTERVAL_MS);
        return () => clearTimeout(timer);
    }, [user]);

    // ---------- Filter + pagination ----------
    useEffect(() => {
        let filtered = [...notifications];

        if (filter === "unread") filtered = filtered.filter((n) => !n.is_read);
        else if (filter === "read") filtered = filtered.filter((n) => n.is_read);

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (n) =>
                    n.title.toLowerCase().includes(term) ||
                    n.message.toLowerCase().includes(term) ||
                    n.type.toLowerCase().includes(term),
            );
        }

        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setCurrentPage(1);
        setSelectedIds(new Set());
        setSelectAll(false);
    }, [notifications, filter, searchTerm, itemsPerPage]);

    const currentItems = useMemo(() => {
        let filtered = [...notifications];
        if (filter === "unread") filtered = filtered.filter((n) => !n.is_read);
        else if (filter === "read") filtered = filtered.filter((n) => n.is_read);

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (n) =>
                    n.title.toLowerCase().includes(term) ||
                    n.message.toLowerCase().includes(term) ||
                    n.type.toLowerCase().includes(term),
            );
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [notifications, filter, searchTerm, currentPage, itemsPerPage]);

    useEffect(() => {
        if (currentItems.length > 0) {
            const allSelected = currentItems.every((item) =>
                selectedIds.has(item.notification_id),
            );
            setSelectAll(allSelected);
        } else {
            setSelectAll(false);
        }
    }, [currentItems, selectedIds]);

    // ---------- Actions ----------
    const handleMarkAsRead = async (id: number) => {
        setActionLoading(id);
        try {
            await notificationAPI.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n)),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setSelectedIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        } catch (error) {
            console.error("Failed to mark as read:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) {
            alert("No unread notifications to mark as read");
            return;
        }
        if (!confirm(`Mark all ${unreadCount} unread notification(s) as read?`)) return;

        setBulkLoading(true);
        try {
            await notificationAPI.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
            setSelectedIds(new Set());
            setSelectAll(false);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
            alert("Failed to mark notifications as read");
        } finally {
            setBulkLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this notification?")) return;
        setActionLoading(id);
        try {
            await notificationAPI.delete(id);
            const deleted = notifications.find((n) => n.notification_id === id);
            setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
            if (deleted && !deleted.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            setSelectedIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        } catch (error) {
            console.error("Failed to delete notification:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkMarkAsRead = async () => {
        if (selectedIds.size === 0) {
            alert("Please select at least one notification");
            return;
        }
        if (!confirm(`Mark ${selectedIds.size} notification(s) as read?`)) return;

        setBulkLoading(true);
        try {
            const ids = Array.from(selectedIds);
            await Promise.all(ids.map((id) => notificationAPI.markAsRead(id)));
            setNotifications((prev) =>
                prev.map((n) => (selectedIds.has(n.notification_id) ? { ...n, is_read: true } : n)),
            );
            setUnreadCount((prev) => Math.max(0, prev - selectedIds.size));
            setSelectedIds(new Set());
            setSelectAll(false);
        } catch (error) {
            console.error("Failed to mark as read:", error);
            alert("Failed to mark notifications as read");
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) {
            alert("Please select at least one notification");
            return;
        }
        if (!confirm(`Delete ${selectedIds.size} notification(s)? This action cannot be undone.`)) return;

        setBulkLoading(true);
        try {
            const ids = Array.from(selectedIds);
            await Promise.all(ids.map((id) => notificationAPI.delete(id)));
            setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.notification_id)));
            const deletedUnread = notifications.filter(
                (n) => selectedIds.has(n.notification_id) && !n.is_read,
            ).length;
            setUnreadCount((prev) => Math.max(0, prev - deletedUnread));
            setSelectedIds(new Set());
            setSelectAll(false);
        } catch (error) {
            console.error("Failed to delete notifications:", error);
            alert("Failed to delete notifications");
        } finally {
            setBulkLoading(false);
        }
    };

    const toggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            const newSelected = new Set(selectedIds);
            currentItems.forEach((item) => newSelected.delete(item.notification_id));
            setSelectedIds(newSelected);
            setSelectAll(false);
        } else {
            const newSelected = new Set(selectedIds);
            currentItems.forEach((item) => newSelected.add(item.notification_id));
            setSelectedIds(newSelected);
            setSelectAll(true);
        }
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
        setSelectAll(false);
    };

    const formatTime = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return "Unknown";
        }
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        setSelectedIds(new Set());
        setSelectAll(false);
        const tableElement = document.getElementById("notification-table");
        if (tableElement) {
            tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newItemsPerPage = parseInt(e.target.value);
        setItemsPerPage(newItemsPerPage);
        setTotalPages(Math.ceil(notifications.length / newItemsPerPage));
        setCurrentPage(1);
        setSelectedIds(new Set());
        setSelectAll(false);
    };

    const selectedCount = selectedIds.size;
    const totalFiltered = notifications
        .filter((n) => {
            if (filter === "unread") return !n.is_read;
            if (filter === "read") return n.is_read;
            return true;
        })
        .filter((n) => {
            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            return (
                n.title.toLowerCase().includes(term) ||
                n.message.toLowerCase().includes(term) ||
                n.type.toLowerCase().includes(term)
            );
        }).length;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading notifications...</p>
                </div>
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
                                <Bell className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Notifications
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">Notifications</h1>
                            <p className="text-blue-100 mt-1">
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block w-2 h-2 bg-blue-300 rounded-full animate-pulse"></span>
                                    Auto-refreshing every 15s
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                                <Bell className="w-4 h-4 mr-1" />
                                {unreadCount} unread
                            </Badge>
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                                    disabled={bulkLoading}
                                >
                                    {bulkLoading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-2" />
                                    )}
                                    Mark all read
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchNotifications}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats pills */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Total</span>
                    <span className="text-sm font-bold text-gray-900">{notifications.length}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">Unread</span>
                    <span className="text-sm font-bold text-yellow-800">{unreadCount}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Read</span>
                    <span className="text-sm font-bold text-green-800">
                        {notifications.length - unreadCount}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                    <span className="text-sm font-medium text-blue-700">Last updated</span>
                    <span className="text-sm font-bold text-blue-800">
                        {lastRefresh.toLocaleTimeString()}
                    </span>
                </div>
                {selectedCount > 0 && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Selected</span>
                        <span className="text-sm font-bold text-blue-800">{selectedCount}</span>
                    </div>
                )}
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        Filters & Search
                    </CardTitle>
                </div>
                <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={filter === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter("all")}
                                className={`rounded-full px-4 ${filter === "all" ? "bg-blue-600" : ""}`}
                            >
                                All ({notifications.length})
                            </Button>
                            <Button
                                variant={filter === "unread" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter("unread")}
                                className={`rounded-full px-4 ${filter === "unread" ? "bg-yellow-500" : ""}`}
                            >
                                <Clock className="w-3 h-3 mr-1" />
                                Unread ({unreadCount})
                            </Button>
                            <Button
                                variant={filter === "read" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter("read")}
                                className={`rounded-full px-4 ${filter === "read" ? "bg-green-600" : ""}`}
                            >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Read ({notifications.length - unreadCount})
                            </Button>
                        </div>
                        <div className="relative flex-1 md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search notifications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 rounded-xl bg-gray-50 border-gray-200"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                >
                                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                </button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk actions bar */}
            {selectedCount > 0 && (
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-gray-900">
                                    {selectedCount} notification{selectedCount > 1 ? "s" : ""} selected
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearSelection}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Clear
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkMarkAsRead}
                                    disabled={bulkLoading}
                                    className="border-blue-300 text-blue-600 hover:bg-blue-50 rounded-xl"
                                >
                                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                                    Mark as Read
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    disabled={bulkLoading}
                                    className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                                >
                                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Count + items per page */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
                    Showing {currentItems.length} of {totalFiltered} notifications
                    {filter === "unread" && " (unread only)"}
                    {filter === "read" && " (read only)"}
                    {searchTerm && ` matching "${searchTerm}"`}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Show:</span>
                    <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            {notifications.length === 0 ? (
                <Card className="text-center py-16 border-0 shadow-lg rounded-xl">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700">No notifications</h3>
                    <p className="text-gray-500 mt-1">
                        {searchTerm
                            ? `No notifications matching "${searchTerm}"`
                            : filter === "unread"
                              ? "You've read all your notifications! 🎉"
                              : filter === "read"
                                ? "No read notifications yet"
                                : "You don't have any notifications yet"}
                    </p>
                    {(searchTerm || filter !== "all") && (
                        <Button
                            variant="link"
                            onClick={() => {
                                setSearchTerm("");
                                setFilter("all");
                            }}
                            className="mt-4"
                        >
                            Clear filters
                        </Button>
                    )}
                </Card>
            ) : (
                <>
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden" id="notification-table">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                                            <button onClick={toggleSelectAll} className="hover:text-blue-600 transition-colors">
                                                {selectAll ? (
                                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-gray-400" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <Bell className="w-3 h-3" />
                                                Notification
                                            </div>
                                        </th>
                                        <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentItems.map((notification) => {
                                        const isUnread = !notification.is_read;
                                        const isSelected = selectedIds.has(notification.notification_id);
                                        return (
                                            <tr
                                                key={notification.notification_id}
                                                className={`hover:bg-blue-50/30 transition-colors group ${isUnread ? "bg-blue-50/10" : ""} ${isSelected ? "bg-blue-100/30" : ""}`}
                                            >
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => toggleSelect(notification.notification_id)}
                                                        className="hover:text-blue-600 transition-colors"
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare className="w-4 h-4 text-blue-600" />
                                                        ) : (
                                                            <Square className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-8 h-8 rounded-lg ${isUnread ? "bg-blue-100" : "bg-gray-100"} flex items-center justify-center flex-shrink-0`}>
                                                            {getNotificationIcon(notification.type)}
                                                        </div>
                                                        <div>
                                                            <p className={`font-semibold text-sm ${isUnread ? "text-gray-900" : "text-gray-600"}`}>
                                                                {notification.title}
                                                            </p>
                                                            <p className={`text-sm ${isUnread ? "text-gray-700" : "text-gray-500"} line-clamp-1 max-w-[400px]`}>
                                                                {notification.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                        {notification.type.replace("_", " ")}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs text-gray-500">{formatTime(notification.created_at)}</span>
                                                </td>
                                                <td className="p-4">
                                                    {isUnread ? (
                                                        <Badge className="bg-yellow-100 text-yellow-700 border-0">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            Unread
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-green-100 text-green-700 border-0">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Read
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {isUnread && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleMarkAsRead(notification.notification_id)}
                                                                disabled={actionLoading === notification.notification_id}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                                            >
                                                                {actionLoading === notification.notification_id ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <Check className="w-3 h-3" />
                                                                )}
                                                                <span className="text-xs ml-1">Read</span>
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(notification.notification_id)}
                                                            disabled={actionLoading === notification.notification_id}
                                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {totalPages > 1 && (
                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                        {Math.min(currentPage * itemsPerPage, totalFiltered)} of {totalFiltered} notifications
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="rounded-xl"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) pageNum = i + 1;
                                                else if (currentPage <= 3) pageNum = i + 1;
                                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                                else pageNum = currentPage - 2 + i;
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={currentPage === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`min-w-[36px] rounded-xl ${currentPage === pageNum ? "bg-blue-600" : ""}`}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="rounded-xl"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            <Card className="bg-blue-50 border-blue-200 rounded-xl">
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800">About Notifications</h4>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>• You'll receive notifications when:</li>
                                <li className="ml-4">- Your vote is confirmed</li>
                                <li className="ml-4">- Your candidacy is approved</li>
                                <li className="ml-4">- Election reminders</li>
                                <li className="ml-4">- Admin responses to your feedback</li>
                                <li>• Notifications auto-refresh every 15 seconds</li>
                                <li>• Use the checkboxes to select multiple notifications</li>
                                <li>• Bulk actions: Mark as Read or Delete selected</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default NotificationsPage;