// resources/js/components/common/NotificationSound.tsx
import React, { useEffect, useRef } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import notificationSound from "../../assets/sounds/notification.mp3";

const NotificationSound: React.FC = () => {
    const { unreadCount } = useNotifications();
    const prevUnreadCountRef = useRef(unreadCount);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isPlayingRef = useRef(false);
    const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ✅ Initialize audio on mount
    useEffect(() => {
        // Create audio element
        audioRef.current = new Audio(notificationSound);
        audioRef.current.volume = 0.5; // Set volume (0.0 to 1.0)
        audioRef.current.preload = "auto";

        // ✅ Preload the audio
        audioRef.current.load();

        // Cleanup on unmount
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (playTimeoutRef.current) {
                clearTimeout(playTimeoutRef.current);
            }
        };
    }, []);

    // ✅ Play sound when new notification arrives
    useEffect(() => {
        // Only play if unread count increased (new notification)
        if (unreadCount > prevUnreadCountRef.current) {
            // ✅ Prevent multiple simultaneous plays
            if (isPlayingRef.current) {
                console.log("🔊 Sound already playing, skipping...");
                return;
            }

            try {
                if (audioRef.current) {
                    isPlayingRef.current = true;

                    // Reset to beginning
                    audioRef.current.currentTime = 0;

                    // Play the sound
                    const playPromise = audioRef.current.play();

                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                console.log("🔊 Notification sound played");
                            })
                            .catch((error) => {
                                // ✅ Handle autoplay blocking
                                if (error.name === "NotAllowedError") {
                                    console.warn(
                                        "🔊 Autoplay blocked, user interaction needed",
                                    );
                                    // Try to play on next user interaction
                                } else {
                                    console.warn(
                                        "🔊 Sound playback error:",
                                        error,
                                    );
                                }
                            })
                            .finally(() => {
                                // ✅ Reset playing flag after sound finishes
                                playTimeoutRef.current = setTimeout(() => {
                                    isPlayingRef.current = false;
                                }, 1000);
                            });
                    }
                }
            } catch (error) {
                console.warn("🔊 Notification sound error:", error);
                isPlayingRef.current = false;
            }
        }

        // Update previous unread count
        prevUnreadCountRef.current = unreadCount;
    }, [unreadCount]);

    // ✅ Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (playTimeoutRef.current) {
                clearTimeout(playTimeoutRef.current);
            }
        };
    }, []);

    // ✅ This component doesn't render anything
    return null;
};

export default NotificationSound;
