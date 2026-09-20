// resources/js/contexts/NotificationContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { notificationAPI } from "../api/notifications";
import type { Notification } from "../api/notifications";
import { useReverb } from "./ReverbContext";

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
    addNotification: (notification: Notification) => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    fetchNotifications: async () => {},
    markAsRead: async () => {},
    markAllAsRead: async () => {},
    deleteNotification: async () => {},
    addNotification: () => {},
    clearNotifications: () => {},
});

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            "useNotifications must be used within a NotificationProvider",
        );
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { user, isAuthenticated } = useAuth();
    const { isConnected, subscribeToUserChannel, unsubscribeFromChannel } =
        useReverb();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const [channel, setChannel] = useState<any | null>(null);

    // ✅ Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!user || !isAuthenticated) {
            console.log("⏳ No user, skipping fetch");
            setLoading(false);
            return;
        }

        console.log("📡 Fetching notifications for user:", user.user_id);
        setLoading(true);

        try {
            const [notifResponse, countResponse] = await Promise.all([
                notificationAPI.getAll(),
                notificationAPI.getUnreadCount(),
            ]);

            console.log("📡 Notifications response:", notifResponse);
            console.log("📡 Unread count response:", countResponse);

            const data = notifResponse.data || [];
            console.log("📡 Extracted notifications:", data.length, "items");
            setNotifications(data);

            const unread = countResponse.data?.unread_count || 0;
            console.log("📡 Unread count:", unread);
            setUnreadCount(unread);

            setInitialFetchDone(true);
        } catch (error) {
            console.error("❌ Failed to fetch notifications:", error);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, [user, isAuthenticated]);

    // ✅ Add new notification
    const addNotification = useCallback((notification: Notification) => {
        console.log("➕ Adding notification:", notification);
        setNotifications((prev) => {
            const exists = prev.some(
                (n) => n.notification_id === notification.notification_id,
            );
            if (exists) return prev;
            return [notification, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
    }, []);

    // ✅ Mark single notification as read
    const markAsRead = useCallback(async (id: number) => {
        console.log("📖 Marking notification as read:", id);
        try {
            await notificationAPI.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.notification_id === id ? { ...n, is_read: true } : n,
                ),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
            throw error;
        }
    }, []);

    // ✅ Mark all as read
    const markAllAsRead = useCallback(async () => {
        console.log("📖 Marking all notifications as read");
        try {
            await notificationAPI.markAllAsRead();
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true })),
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
            throw error;
        }
    }, []);

    // ✅ Delete notification
    const deleteNotification = useCallback(
        async (id: number) => {
            console.log("🗑️ Deleting notification:", id);
            try {
                await notificationAPI.delete(id);
                setNotifications((prev) =>
                    prev.filter((n) => n.notification_id !== id),
                );
                const deleted = notifications.find(
                    (n) => n.notification_id === id,
                );
                if (deleted && !deleted.is_read) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }
            } catch (error) {
                console.error("Failed to delete notification:", error);
                throw error;
            }
        },
        [notifications],
    );

    // ✅ Clear notifications
    const clearNotifications = useCallback(() => {
        console.log("🧹 Clearing all notifications");
        setNotifications([]);
        setUnreadCount(0);
        setInitialFetchDone(false);
    }, []);

    // ✅ Auto-fetch on auth change
    useEffect(() => {
        if (user && isAuthenticated) {
            console.log("🔐 User authenticated, fetching notifications...");
            fetchNotifications();
        } else {
            console.log("🚪 User not authenticated, clearing notifications");
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
        }
    }, [user, isAuthenticated, fetchNotifications]);

    // ✅ Subscribe to WebSocket for real-time updates
    useEffect(() => {
        if (!user || !isConnected || !isAuthenticated) {
            console.log("⏳ Notification provider: Reverb not ready");
            return;
        }

        console.log(
            `📡 Notification provider: Subscribing to user.${user.user_id}`,
        );

        const userChannel = subscribeToUserChannel(user.user_id, (data) => {
            console.log("🔔 New notification via WebSocket:", data);
            if (data && data.notification) {
                addNotification(data.notification);
                // Show browser notification
                if (
                    "Notification" in window &&
                    Notification.permission === "granted"
                ) {
                    try {
                        new Notification(data.notification.title, {
                            body: data.notification.message,
                            icon: "/occlogo.jpg",
                        });
                    } catch (e) {
                        // Silent fail
                    }
                }
            }
        });

        setChannel(userChannel);

        return () => {
            if (userChannel) {
                unsubscribeFromChannel(userChannel);
            }
        };
    }, [
        user,
        isConnected,
        isAuthenticated,
        subscribeToUserChannel,
        unsubscribeFromChannel,
        addNotification,
    ]);

    const value = {
        notifications,
        unreadCount,
        loading: loading && !initialFetchDone,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
        clearNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;
