// resources/js/api/notifications.ts
import axios from "./axios";

export interface Notification {
    notification_id: number;
    user_id: number;
    title: string;
    message: string;
    type:
        | "election_reminder"
        | "vote_confirmation"
        | "candidate_approval"
        | "feedback_response"
        | "system";
    is_read: boolean;
    data: any;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

export const notificationAPI = {
    // Get all notifications for current user
    getAll: async (): Promise<{ data: Notification[] }> => {
        try {
            const response = await axios.get("/notifications");
            console.log("📡 Notifications API response:", response.data);

            // Handle different response structures
            let notifications: Notification[] = [];
            if (response.data) {
                if (Array.isArray(response.data)) {
                    notifications = response.data;
                } else if (
                    response.data.data &&
                    Array.isArray(response.data.data)
                ) {
                    notifications = response.data.data;
                } else if (
                    response.data.data &&
                    response.data.data.data &&
                    Array.isArray(response.data.data.data)
                ) {
                    notifications = response.data.data.data;
                }
            }

            return { data: notifications };
        } catch (error) {
            console.error("❌ Failed to fetch notifications:", error);
            throw error;
        }
    },

    // Get unread count
    getUnreadCount: async (): Promise<{ data: { unread_count: number } }> => {
        try {
            const response = await axios.get("/notifications/unread-count");
            console.log("📡 Unread count API response:", response.data);

            let unreadCount = 0;
            if (response.data) {
                if (typeof response.data === "number") {
                    unreadCount = response.data;
                } else if (response.data.unread_count !== undefined) {
                    unreadCount = response.data.unread_count;
                } else if (response.data.data?.unread_count !== undefined) {
                    unreadCount = response.data.data.unread_count;
                }
            }

            return { data: { unread_count: unreadCount } };
        } catch (error) {
            console.error("❌ Failed to fetch unread count:", error);
            throw error;
        }
    },

    // Mark single notification as read
    markAsRead: (id: number): Promise<{ data: { success: boolean } }> =>
        axios.put(`/notifications/${id}/read`),

    // Mark all notifications as read
    markAllAsRead: (): Promise<{ data: { success: boolean } }> =>
        axios.put("/notifications/mark-all-read"),

    // Delete notification
    delete: (id: number): Promise<{ data: { success: boolean } }> =>
        axios.delete(`/notifications/${id}`),
};
