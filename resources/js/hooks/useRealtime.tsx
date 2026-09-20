// // resources/js/hooks/useRealtime.tsx
// import { useEffect, useState } from "react";
// import { useAuth } from "../contexts/AuthContext";

// // Dynamically import Echo only when needed
// let echoInstance: any = null;

// const loadEcho = async () => {
//     if (echoInstance) return echoInstance;

//     try {
//         const [{ default: Echo }, { default: Pusher }] = await Promise.all([
//             import("laravel-echo"),
//             import("pusher-js"),
//         ]);

//         window.Pusher = Pusher;

//         echoInstance = new Echo({
//             broadcaster: "pusher",
//             key: "8837731d475b0e2546a4",
//             cluster: "ap1",
//             forceTLS: true,
//             enabledTransports: ["ws", "wss"],
//             authEndpoint: "/api/web/broadcasting/auth",
//             auth: {
//                 headers: {
//                     Authorization: `Bearer ${localStorage.getItem("access_token")}`,
//                 },
//             },
//         });

//         return echoInstance;
//     } catch (error) {
//         console.error("Failed to load Echo:", error);
//         return null;
//     }
// };

// export const useRealtimeNotifications = () => {
//     const { user } = useAuth();
//     const [notifications, setNotifications] = useState<any[]>([]);
//     const [unreadCount, setUnreadCount] = useState(0);

//     useEffect(() => {
//         let channel: any = null;

//         const setupRealtime = async () => {
//             if (!user) return;

//             const echo = await loadEcho();
//             if (!echo) return;

//             // Listen for new notifications
//             channel = echo.private(`user.${user.user_id}`);
//             channel.listen(".new-notification", (data: any) => {
//                 console.log("New notification received:", data);
//                 setNotifications((prev) => [data.notification, ...prev]);
//                 setUnreadCount((prev) => prev + 1);

//                 // Show browser notification if permitted
//                 if (Notification.permission === "granted") {
//                     new Notification(data.notification.title, {
//                         body: data.notification.message,
//                         icon: "/favicon.ico",
//                     });
//                 }
//             });
//         };

//         setupRealtime();

//         return () => {
//             if (channel) {
//                 channel.stopListening(".new-notification");
//             }
//         };
//     }, [user]);

//     return { notifications, unreadCount };
// };

// export const useRealtimeElection = (electionId: number | string) => {
//     const [liveResults, setLiveResults] = useState({});
//     const [turnout, setTurnout] = useState<any>(null);

//     useEffect(() => {
//         let channel: any = null;

//         const setupElectionChannel = async () => {
//             if (!electionId) return;

//             const echo = await loadEcho();
//             if (!echo) return;

//             channel = echo.channel(`election.${electionId}`);

//             channel.listen(".vote-cast", (data: any) => {
//                 console.log("Vote cast:", data);
//                 setLiveResults((prev) => ({
//                     ...prev,
//                     [data.candidate_id]: data.vote_count,
//                 }));
//             });

//             channel.listen(".turnout-updated", (data: any) => {
//                 console.log("Turnout updated:", data);
//                 setTurnout(data);
//             });
//         };

//         setupElectionChannel();

//         return () => {
//             if (channel) {
//                 channel.stopListening(".vote-cast");
//                 channel.stopListening(".turnout-updated");
//             }
//         };
//     }, [electionId]);

//     return { liveResults, turnout };
// };

// // Request notification permission
// export const requestNotificationPermission = () => {
//     if ("Notification" in window) {
//         Notification.requestPermission();
//     }
// };
