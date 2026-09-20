// resources/js/components/common/NotificationCenter.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useReverb } from "../../contexts/ReverbContext";
import { useNotifications } from "../../contexts/NotificationContext";
import {
    Bell,
    AlertCircle,
    Vote,
    UserCheck,
    Calendar,
    MessageCircle,
    Loader2,
    Check,
    Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface NotificationCenterProps {
    className?: string;
}

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

const getNotificationTypeColor = (type: string) => {
    switch (type) {
        case "vote_confirmation":
            return "bg-green-50 border-green-200";
        case "candidate_approval":
            return "bg-blue-50 border-blue-200";
        case "election_reminder":
            return "bg-orange-50 border-orange-200";
        case "feedback_response":
            return "bg-purple-50 border-purple-200";
        default:
            return "bg-gray-50 border-gray-200";
    }
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    className,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { echo, isConnected } = useReverb();

    // ✅ Use NotificationContext
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // ✅ Refs for caching
    const hasLoadedRef = useRef(false);
    const lastFetchTimeRef = useRef<number>(0);
    const CACHE_DURATION = 30000;
    const isFetchingRef = useRef(false);

    // ✅ Fetch notifications with caching
    const fetchNotificationsWithCache = useCallback(
        async (force = false) => {
            const now = Date.now();
            if (
                !force &&
                hasLoadedRef.current &&
                now - lastFetchTimeRef.current < CACHE_DURATION
            ) {
                console.log("📡 Using cached notifications");
                return;
            }

            if (isFetchingRef.current) {
                console.log("⏳ Already fetching, skipping...");
                return;
            }

            isFetchingRef.current = true;
            await fetchNotifications();
            hasLoadedRef.current = true;
            lastFetchTimeRef.current = Date.now();
            isFetchingRef.current = false;
        },
        [fetchNotifications],
    );

    // ✅ Refresh when dropdown opens
    useEffect(() => {
        if (isOpen) {
            const now = Date.now();
            const cacheExpired =
                now - lastFetchTimeRef.current >= CACHE_DURATION;

            if (cacheExpired || !hasLoadedRef.current) {
                console.log("📡 Cache expired, fetching fresh data...");
                fetchNotificationsWithCache(true);
            }
        }
    }, [isOpen, fetchNotificationsWithCache]);

    // ✅ Initial load
    useEffect(() => {
        if (user) {
            fetchNotificationsWithCache(true);
        }
    }, [user]);

    // ✅ Mark notification as read
    const handleMarkAsRead = async (notificationId: number) => {
        setActionLoading(notificationId);
        try {
            await markAsRead(notificationId);
            lastFetchTimeRef.current = 0;
        } catch (error) {
            console.error("❌ Failed to mark as read:", error);
        } finally {
            setActionLoading(null);
        }
    };

    // ✅ Mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            lastFetchTimeRef.current = 0;
        } catch (error) {
            console.error("❌ Failed to mark all as read:", error);
        }
    };

    // ✅ Request notification permission
    const requestNotificationPermission = useCallback(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // ✅ Format time
    const formatTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
            });
        } catch {
            return "recently";
        }
    };

    // ✅ Get visible notifications (only 10 for dropdown)
    const visibleNotifications = notifications.slice(0, 10);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`relative rounded-full w-9 h-9 p-0 hover:bg-gray-100 transition-all duration-200 ${className || ""}`}
                    onClick={requestNotificationPermission}
                >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md animate-pulse">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                    {isConnected && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[400px] p-0 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-top-2 duration-200"
            >
                {/* Header */}
                <div className="bg-blue-600 px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-white/80" />
                                <h3 className="font-semibold text-white">
                                    Notifications
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-blue-100">
                                    {isConnected ? (
                                        <>
                                            <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                                            {unreadCount > 0
                                                ? `${unreadCount} unread`
                                                : "All caught up!"}
                                        </>
                                    ) : (
                                        <>
                                            <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1"></span>
                                            Reconnecting...
                                        </>
                                    )}
                                </p>
                                <span className="text-blue-200 text-[10px]">
                                    •
                                </span>
                                <span className="text-blue-200 text-[10px]">
                                    {notifications.length} total
                                </span>
                            </div>
                        </div>
                        {notifications.length > 0 && unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="text-white hover:bg-white/20 text-xs h-7 px-3 rounded-lg"
                            >
                                <Check className="w-3 h-3 mr-1" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                </div>

                {/* Notification List */}
                {loading && !hasLoadedRef.current ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-400">
                                Loading notifications...
                            </p>
                        </div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium text-sm">
                            No notifications yet
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            We'll notify you when something happens
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[420px]">
                        <div className="divide-y divide-gray-100">
                            {visibleNotifications.map((notification) => {
                                const isUnread = !notification.is_read;
                                return (
                                    <div
                                        key={notification.notification_id}
                                        className={`relative p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer group ${
                                            isUnread ? "bg-blue-50/20" : ""
                                        }`}
                                        onClick={() => {
                                            if (isUnread) {
                                                handleMarkAsRead(
                                                    notification.notification_id,
                                                );
                                            }
                                        }}
                                    >
                                        {isUnread && (
                                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"></div>
                                        )}

                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`flex-shrink-0 w-9 h-9 rounded-full ${getNotificationTypeColor(notification.type)} flex items-center justify-center border`}
                                            >
                                                {getNotificationIcon(
                                                    notification.type,
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-0.5">
                                                    <p
                                                        className={`text-sm font-semibold ${
                                                            isUnread
                                                                ? "text-gray-900"
                                                                : "text-gray-600"
                                                        }`}
                                                    >
                                                        {notification.title}
                                                    </p>
                                                </div>
                                                <p
                                                    className={`text-sm ${
                                                        isUnread
                                                            ? "text-gray-700"
                                                            : "text-gray-500"
                                                    } line-clamp-2`}
                                                >
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-xs text-gray-400">
                                                        {formatTime(
                                                            notification.created_at,
                                                        )}
                                                    </span>
                                                    {notification.type && (
                                                        <span className="text-[10px] text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full">
                                                            {notification.type.replace(
                                                                "_",
                                                                " ",
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isUnread && (
                                                    <button
                                                        className="p-1 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsRead(
                                                                notification.notification_id,
                                                            );
                                                        }}
                                                        disabled={
                                                            actionLoading ===
                                                            notification.notification_id
                                                        }
                                                    >
                                                        {actionLoading ===
                                                        notification.notification_id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Check className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}

                <DropdownMenuSeparator />

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="p-2 bg-gray-50/80">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-gray-500 hover:text-blue-600 text-sm font-medium"
                            onClick={() => {
                                setIsOpen(false);
                                navigate("/notifications");
                            }}
                        >
                            View all notifications
                            <Sparkles className="w-3 h-3 ml-1.5" />
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationCenter;
