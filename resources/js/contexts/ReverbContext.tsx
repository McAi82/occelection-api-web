// resources/js/contexts/ReverbContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
} from "react";
import { useAuth } from "./AuthContext";

// ✅ Dynamic import for Echo and Pusher
let Echo: any = null;
let Pusher: any = null;

declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

interface ReverbContextType {
    isConnected: boolean;
    echo: any | null;
    subscribeToUserChannel: (
        userId: number,
        callback: (data: any) => void,
    ) => any | null;
    subscribeToElectionChannel: (
        electionId: number,
        callback: (data: any) => void,
    ) => any | null;
    unsubscribeFromChannel: (channel: any) => void;
}

const ReverbContext = createContext<ReverbContextType>({
    isConnected: false,
    echo: null,
    subscribeToUserChannel: () => null,
    subscribeToElectionChannel: () => null,
    unsubscribeFromChannel: () => {},
});

export const useReverb = () => useContext(ReverbContext);

export const ReverbProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { isAuthenticated, user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [echo, setEcho] = useState<any | null>(null);
    const channelsRef = useRef<Map<string, any>>(new Map());
    const echoInstanceRef = useRef<any>(null);
    const mountedRef = useRef(true);
    const isConnectingRef = useRef(false);
    const subscriptionsReadyRef = useRef(false);

    // ✅ Load Echo and Pusher dynamically
    useEffect(() => {
        const loadDependencies = async () => {
            if (!Echo) {
                try {
                    const [echoModule, pusherModule] = await Promise.all([
                        import("laravel-echo"),
                        import("pusher-js"),
                    ]);
                    Echo = echoModule.default;
                    Pusher = pusherModule.default;
                    console.log("✅ Echo and Pusher loaded");

                    if (isAuthenticated && user) {
                        connect();
                    }
                } catch (err) {
                    console.error("❌ Failed to load Echo/Pusher:", err);
                }
            }
        };
        loadDependencies();
    }, []);

    // ✅ Simple connection function
    const connect = async () => {
        if (isConnectingRef.current) {
            console.log("⏳ Already connecting...");
            return;
        }

        if (!isAuthenticated || !user) {
            console.log("⏳ Not authenticated");
            return;
        }

        if (!Echo || !Pusher) {
            console.log("⏳ Echo/Pusher not loaded yet");
            return;
        }

        isConnectingRef.current = true;

        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                console.warn("⚠️ No access token");
                isConnectingRef.current = false;
                return;
            }

            const appKey = import.meta.env.VITE_REVERB_APP_KEY || "471820";
            const host = import.meta.env.VITE_REVERB_HOST || "127.0.0.1";
            const port = parseInt(import.meta.env.VITE_REVERB_PORT || "8082");
            const scheme = import.meta.env.VITE_REVERB_SCHEME || "http";

            console.log(`🔌 Connecting to Reverb: ${scheme}://${host}:${port}`);

            // ✅ Set Pusher globally
            window.Pusher = Pusher;

            // ✅ Create Echo instance
            const echoInstance = new Echo({
                broadcaster: "reverb",
                key: appKey,
                wsHost: host,
                wsPort: port,
                wssPort: port,
                forceTLS: scheme === "https",
                enabledTransports: ["ws", "wss"],
                authEndpoint: "/api/web/broadcasting/auth",
                auth: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                },
            });

            echoInstanceRef.current = echoInstance;
            setEcho(echoInstance);

            const pusher = echoInstance?.connector?.pusher;

            if (!pusher) {
                console.warn("⚠️ Could not access underlying Pusher client");
                isConnectingRef.current = false;
                return;
            }

            // ✅ Connection events
            pusher.connection.bind("connected", () => {
                if (!mountedRef.current) return;
                console.log("✅ Reverb connected!");
                setIsConnected(true);
                isConnectingRef.current = false;
                subscriptionsReadyRef.current = true;

                // ✅ Subscribe to user channel immediately
                if (user && user.user_id) {
                    setTimeout(() => {
                        console.log(`📡 Subscribing to user.${user.user_id}`);
                        subscribeToUserChannel(user.user_id, (data) => {
                            console.log("🔔 New notification received:", data);
                        });
                    }, 500);
                }
            });

            pusher.connection.bind("disconnected", () => {
                if (!mountedRef.current) return;
                console.warn("⚠️ Reverb disconnected");
                setIsConnected(false);
                subscriptionsReadyRef.current = false;
            });

            pusher.connection.bind("error", (err: any) => {
                console.warn("❌ Reverb connection error:", err);
                setIsConnected(false);
                subscriptionsReadyRef.current = false;
            });

            console.log("📡 Pusher connection state:", pusher.connection.state);
        } catch (err) {
            console.error("❌ Connection error:", err);
            setIsConnected(false);
            isConnectingRef.current = false;
        }
    };

    // ✅ Initial connection
    useEffect(() => {
        mountedRef.current = true;

        const timer = setTimeout(() => {
            if (isAuthenticated && user) {
                connect();
            }
        }, 1000);

        return () => {
            mountedRef.current = false;
            if (echoInstanceRef.current) {
                try {
                    echoInstanceRef.current.disconnect();
                } catch (e) {
                    // Ignore
                }
                echoInstanceRef.current = null;
            }
            clearTimeout(timer);
        };
    }, []);

    // ✅ Reconnect when auth changes
    useEffect(() => {
        if (isAuthenticated && user) {
            if (!isConnected && !isConnectingRef.current) {
                connect();
            }
        } else {
            if (echoInstanceRef.current) {
                try {
                    echoInstanceRef.current.disconnect();
                } catch (e) {
                    // Ignore
                }
                echoInstanceRef.current = null;
                setEcho(null);
                setIsConnected(false);
            }
        }
    }, [isAuthenticated, user]);

    // ✅ Subscribe to user channel
    const subscribeToUserChannel = (
        userId: number,
        callback: (data: any) => void,
    ): any | null => {
        const instance = echoInstanceRef.current;

        if (!instance) {
            console.warn("⚠️ Echo instance not available");
            return null;
        }

        const key = `user.${userId}`;

        if (channelsRef.current.has(key)) {
            console.log(`📡 Already subscribed to ${key}`);
            return channelsRef.current.get(key);
        }

        try {
            console.log(`📡 Subscribing to ${key}...`);
            const channel = instance.private(key);

            // ✅ Listen for the event
            channel.listen(".NewNotification", (data: any) => {
                console.log(`🔔🔔🔔 New notification on ${key}:`, data);
                callback(data);
            });

            // ✅ Also listen without dot
            channel.listen("NewNotification", (data: any) => {
                console.log(
                    `🔔🔔🔔 New notification on ${key} (no dot):`,
                    data,
                );
                callback(data);
            });

            channel.subscribed(() => {
                console.log(`✅ Successfully subscribed to ${key}`);
            });

            channel.error((err: any) => {
                console.error(`❌ Error on channel ${key}:`, err);
            });

            channelsRef.current.set(key, channel);
            return channel;
        } catch (err) {
            console.error(`❌ Failed to subscribe to ${key}:`, err);
            return null;
        }
    };

    // ✅ Subscribe to election channel
    const subscribeToElectionChannel = (
        electionId: number,
        callback: (data: any) => void,
    ): any | null => {
        const instance = echoInstanceRef.current;
        if (!instance || !isConnected) {
            console.warn(
                `⚠️ Cannot subscribe to election.${electionId} - not connected`,
            );
            return null;
        }

        const key = `election.${electionId}`;
        if (channelsRef.current.has(key)) {
            return channelsRef.current.get(key);
        }

        try {
            const channel = instance.channel(key);
            channel.listen("VoteCast", (data: any) => {
                console.log(`🗳️ Vote cast:`, data);
                callback(data);
            });
            channel.listen("TurnoutUpdated", (data: any) => {
                console.log(`📊 Turnout updated:`, data);
                callback(data);
            });
            channelsRef.current.set(key, channel);
            console.log(`✅ Subscribed to ${key}`);
            return channel;
        } catch (err) {
            console.error(`❌ Failed to subscribe to ${key}:`, err);
            return null;
        }
    };

    // ✅ Unsubscribe
    const unsubscribeFromChannel = (channel: any): void => {
        if (!channel) return;
        try {
            channel.stopListening();
            for (const [key, value] of channelsRef.current) {
                if (value === channel) {
                    channelsRef.current.delete(key);
                    console.log(`🔌 Unsubscribed from ${key}`);
                    break;
                }
            }
        } catch (e) {
            // Ignore
        }
    };

    const value = {
        isConnected,
        echo,
        subscribeToUserChannel,
        subscribeToElectionChannel,
        unsubscribeFromChannel,
    };

    return (
        <ReverbContext.Provider value={value}>
            {children}
        </ReverbContext.Provider>
    );
};

export default ReverbProvider;
