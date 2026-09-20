// resources/js/pages/Timeline.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import { campaignPostAPI, CampaignPost } from "../api/campaignPosts";
import { electionAPI } from "../api/elections";
import { RefreshButton } from "../components/common/RefreshButton";
import {
    MessageCircle,
    ThumbsUp,
    Pin,
    Calendar,
    Send,
    X,
    Loader2,
    Sparkles,
    ChevronDown,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
}

// ✅ Reaction types with emojis and colors
const REACTION_TYPES = {
    like: {
        label: "Like",
        emoji: "👍",
        color: "text-blue-500",
        bg: "bg-blue-50",
    },
    heart: {
        label: "Love",
        emoji: "❤️",
        color: "text-red-500",
        bg: "bg-red-50",
    },
    laugh: {
        label: "Haha",
        emoji: "😂",
        color: "text-yellow-500",
        bg: "bg-yellow-50",
    },
    wow: {
        label: "Wow",
        emoji: "😮",
        color: "text-purple-500",
        bg: "bg-purple-50",
    },
    sad: {
        label: "Sad",
        emoji: "😢",
        color: "text-blue-400",
        bg: "bg-blue-50",
    },
    angry: {
        label: "Angry",
        emoji: "😡",
        color: "text-red-600",
        bg: "bg-red-50",
    },
};

type ReactionType = keyof typeof REACTION_TYPES;

// ✅ Reaction picker component - positioned above the button
const ReactionPicker: React.FC<{
    onSelect: (type: ReactionType) => void;
    onClose: () => void;
    currentReaction?: ReactionType;
    isVisible: boolean;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
}> = ({ onSelect, onClose, currentReaction, isVisible, buttonRef }) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (isVisible && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Position above the button, centered
            setPosition({
                x: rect.left + rect.width / 2,
                y: rect.top - 20,
            });
        }
    }, [isVisible, buttonRef]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    if (!isVisible) return null;

    return (
        <div
            ref={pickerRef}
            className="fixed bg-white rounded-2xl shadow-2xl border border-gray-200 px-3 py-2 flex gap-1 z-[999] animate-in fade-in zoom-in-95 duration-200"
            style={{
                left: position.x,
                top: position.y,
                transform: "translateX(-50%) translateY(-100%)",
            }}
        >
            {Object.entries(REACTION_TYPES).map(([key, reaction]) => {
                const isActive = currentReaction === key;
                return (
                    <button
                        key={key}
                        onClick={() => {
                            onSelect(key as ReactionType);
                            onClose();
                        }}
                        className={`w-12 h-12 rounded-full hover:scale-125 transition-all duration-200 flex items-center justify-center text-3xl ${
                            isActive
                                ? "ring-2 ring-blue-500 bg-blue-50 scale-110"
                                : ""
                        } hover:bg-gray-100`}
                        title={reaction.label}
                    >
                        {reaction.emoji}
                    </button>
                );
            })}
        </div>
    );
};

const Timeline: React.FC = () => {
    const navigate = useNavigate();
    const [elections, setElections] = useState<Election[]>([]);
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [posts, setPosts] = useState<CampaignPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [commentInputs, setCommentInputs] = useState<Record<number, string>>(
        {},
    );
    const [showCommentDialog, setShowCommentDialog] = useState<number | null>(
        null,
    );
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newPost, setNewPost] = useState({
        content: "",
        title: "",
        type: "update",
    });
    const [submitting, setSubmitting] = useState(false);
    const [userRole, setUserRole] = useState<string>("voter");
    const [activeReactionPicker, setActiveReactionPicker] = useState<
        number | null
    >(null);
    const [longPressTimer, setLongPressTimer] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const buttonRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        fetchElections();
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setUserRole(user.role || "voter");
    }, []);

    useEffect(() => {
        if (selectedElection) {
            setPosts([]);
            setPage(1);
            setHasMore(true);
            fetchPosts();
        }
    }, [selectedElection]);

    useEffect(() => {
        if (selectedElection && page > 1) fetchPosts();
    }, [page]);

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                setPage((prev) => prev + 1);
            }
        });
        if (loadMoreRef.current)
            observerRef.current.observe(loadMoreRef.current);
        return () => observerRef.current?.disconnect();
    }, [hasMore, loading]);

    const fetchElections = async () => {
        try {
            const response = await electionAPI.getAll();
            const data = Array.isArray(response.data) ? response.data : [];
            setElections(data);
            if (data.length > 0)
                setSelectedElection(data[0].election_id.toString());
        } catch (error) {
            console.error("Failed to fetch elections:", error);
        }
    };

    const fetchPosts = async () => {
        if (!selectedElection) return;
        setLoading(true);
        try {
            const response = await campaignPostAPI.getPosts(
                parseInt(selectedElection),
                page,
            );
            const result = response.data;
            let postsData = [];
            if (result.data?.data) {
                postsData = result.data.data;
                setHasMore(!!result.data.next_page_url);
            } else if (Array.isArray(result.data)) {
                postsData = result.data;
                setHasMore(false);
            }
            setPosts((prev) =>
                page === 1 ? postsData : [...prev, ...postsData],
            );
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        fetchPosts();
    };

    const getUserReaction = (post: CampaignPost): ReactionType | null => {
        if (!post.user_reaction) return null;
        return post.user_reaction.type as ReactionType;
    };

    const getReactionCounts = (post: CampaignPost) => {
        const reactions = post.reactions || [];
        const counts: Record<string, number> = {};
        Object.keys(REACTION_TYPES).forEach((key) => {
            counts[key] = reactions.filter((r) => r.type === key).length;
        });
        return counts;
    };

    const handleComment = async (postId: number) => {
        const content = commentInputs[postId]?.trim();
        if (!content) return;
        try {
            const response = await campaignPostAPI.addComment(postId, content);
            setPosts((prev) =>
                prev.map((post) => {
                    if (post.post_id === postId) {
                        const newComment = response.data.data;
                        return {
                            ...post,
                            comments: [newComment, ...(post.comments || [])],
                            comments_count: (post.comments_count || 0) + 1,
                        };
                    }
                    return post;
                }),
            );
            setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
            setShowCommentDialog(null);
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    };

    // ✅ Handle reaction
    const handleReaction = async (postId: number, type: ReactionType) => {
        try {
            const post = posts.find((p) => p.post_id === postId);
            const currentReaction = post?.user_reaction;

            // If clicking the same reaction, remove it (toggle off)
            if (currentReaction && currentReaction.type === type) {
                await campaignPostAPI.removeReaction(postId);
                setPosts((prev) =>
                    prev.map((p) => {
                        if (p.post_id === postId) {
                            const user = JSON.parse(
                                localStorage.getItem("user") || "{}",
                            );
                            return {
                                ...p,
                                reactions: (p.reactions || []).filter(
                                    (r) => r.user_id !== user.user_id,
                                ),
                                user_reaction: undefined,
                            };
                        }
                        return p;
                    }),
                );
                setActiveReactionPicker(null);
                return;
            }

            // Add new reaction
            const response = await campaignPostAPI.addReaction(postId, type);
            const reaction = response.data.data;
            setPosts((prev) =>
                prev.map((p) => {
                    if (p.post_id === postId) {
                        const filtered = (p.reactions || []).filter(
                            (r) => r.user_id !== reaction.user_id,
                        );
                        return {
                            ...p,
                            reactions: [...filtered, reaction],
                            user_reaction: reaction,
                        };
                    }
                    return p;
                }),
            );
            setActiveReactionPicker(null);
        } catch (error) {
            console.error("Failed to add reaction:", error);
        }
    };

    // ✅ Handle long press with proper timer management
    const startLongPress = (postId: number) => {
        // Clear any existing timer
        if (longPressTimer) {
            window.clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }

        setIsDragging(false);
        setActiveReactionPicker(null);

        // Set new timer (600ms)
        const timer = window.setTimeout(() => {
            setActiveReactionPicker(postId);
            setIsDragging(true);
        }, 600);
        setLongPressTimer(timer);
    };

    const endLongPress = (postId: number) => {
        // Clear timer
        if (longPressTimer) {
            window.clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }

        // If not dragging and picker not shown, it's a short click -> toggle like
        if (!isDragging && activeReactionPicker === null) {
            const post = posts.find((p) => p.post_id === postId);
            const currentReaction = post?.user_reaction;
            if (currentReaction && currentReaction.type === "like") {
                handleReaction(postId, "like");
            } else {
                handleReaction(postId, "like");
            }
        }

        // Hide picker after a delay
        setTimeout(() => {
            setActiveReactionPicker(null);
            setIsDragging(false);
        }, 300);
    };

    const handleMouseDown = (e: React.MouseEvent, postId: number) => {
        e.preventDefault();
        startLongPress(postId);
    };

    const handleMouseUp = (e: React.MouseEvent, postId: number) => {
        e.preventDefault();
        endLongPress(postId);
    };

    const handleMouseLeave = () => {
        if (longPressTimer) {
            window.clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
        setTimeout(() => {
            if (!isDragging) {
                setActiveReactionPicker(null);
            }
        }, 300);
    };

    // ✅ Touch support for mobile
    const handleTouchStart = (e: React.TouchEvent, postId: number) => {
        e.preventDefault();
        startLongPress(postId);
    };

    const handleTouchEnd = (e: React.TouchEvent, postId: number) => {
        e.preventDefault();
        endLongPress(postId);
    };

    const handleCreatePost = async () => {
        if (!newPost.content.trim()) return;
        setSubmitting(true);
        try {
            const response = await campaignPostAPI.createPost({
                election_id: parseInt(selectedElection),
                content: newPost.content,
                title: newPost.title || undefined,
                type: newPost.type as "survey" | "announcement" | "update",
            });
            setPosts((prev) => [response.data.data, ...prev]);
            setShowCreateDialog(false);
            setNewPost({ content: "", title: "", type: "update" });
        } catch (error) {
            console.error("Failed to create post:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const getPostTypeColor = (type: string) => {
        switch (type) {
            case "survey":
                return "bg-purple-100 text-purple-700";
            case "announcement":
                return "bg-blue-100 text-blue-700";
            default:
                return "bg-green-100 text-green-700";
        }
    };

    const canCreatePost = userRole === "candidate" || userRole === "admin";

    if (loading && page === 1) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">
                        Campaign Timeline
                    </h1>
                    <p className="text-sm text-gray-500">
                        See what candidates are sharing
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <RefreshButton
                        onClick={handleRefresh}
                        isLoading={refreshing}
                    />
                    {canCreatePost && (
                        <Dialog
                            open={showCreateDialog}
                            onOpenChange={setShowCreateDialog}
                        >
                            <DialogTrigger asChild>
                                <Button className="bg-purple-600 hover:from-purple-700 hover:to-pink-700">
                                    <Sparkles className="w-4 h-4 mr-2" /> Create
                                    Post
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="text-xl">
                                        Create Campaign Post
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <Input
                                        placeholder="Post title (optional)"
                                        value={newPost.title}
                                        onChange={(e) =>
                                            setNewPost({
                                                ...newPost,
                                                title: e.target.value,
                                            })
                                        }
                                    />
                                    <Textarea
                                        placeholder="What do you want to ask or announce?"
                                        value={newPost.content}
                                        onChange={(e) =>
                                            setNewPost({
                                                ...newPost,
                                                content: e.target.value,
                                            })
                                        }
                                        rows={4}
                                        className="resize-none"
                                    />
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">
                                            Post Type
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newPost.type}
                                            onChange={(e) =>
                                                setNewPost({
                                                    ...newPost,
                                                    type: e.target.value,
                                                })
                                            }
                                        >
                                            <option value="survey">
                                                Survey
                                            </option>
                                            <option value="announcement">
                                                Announcement
                                            </option>
                                            <option value="update">
                                                Update
                                            </option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setShowCreateDialog(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleCreatePost}
                                            disabled={
                                                submitting ||
                                                !newPost.content.trim()
                                            }
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {submitting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "Post"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* Election Selector */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-blue-600 px-5 py-3.5">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Calendar className="w-4 h-4" /> Select Election
                    </div>
                </div>
                <div className="p-4">
                    <div className="relative">
                        <select
                            className="w-full max-w-sm px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-900 appearance-none bg-white"
                            value={selectedElection}
                            onChange={(e) =>
                                setSelectedElection(e.target.value)
                            }
                        >
                            <option value="">Select an election</option>
                            {elections.map((election) => (
                                <option
                                    key={election.election_id}
                                    value={election.election_id}
                                >
                                    {election.title}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
                {posts.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
                        <MessageCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">
                            No posts yet for this election
                        </p>
                        {canCreatePost && (
                            <button
                                className="text-blue-600 font-bold text-sm mt-2 hover:underline"
                                onClick={() => setShowCreateDialog(true)}
                            >
                                Create the first post
                            </button>
                        )}
                    </div>
                ) : (
                    posts.map((post) => {
                        const userReaction = getUserReaction(post);
                        const isLiked = userReaction !== null;
                        const reactionCounts = getReactionCounts(post);
                        const totalReactions = (post.reactions || []).length;

                        const topReactions = Object.entries(reactionCounts)
                            .filter(([_, count]) => count > 0)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3);

                        const buttonRef = (el: HTMLButtonElement | null) => {
                            buttonRefs.current.set(post.post_id, el);
                        };

                        return (
                            <div
                                key={post.post_id}
                                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                            >
                                {/* Post Header */}
                                <div className="p-4 pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                                            {post.candidate?.user
                                                ?.first_name?.[0] || "C"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-gray-900">
                                                {post.candidate?.user
                                                    ?.first_name ||
                                                    "Candidate"}{" "}
                                                {post.candidate?.user
                                                    ?.last_name || ""}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>
                                                    {post.candidate?.position
                                                        ?.title || "Candidate"}
                                                </span>
                                                {post.candidate?.partylist && (
                                                    <>
                                                        <span>•</span>
                                                        <span>
                                                            {
                                                                post.candidate
                                                                    .partylist
                                                                    .name
                                                            }
                                                        </span>
                                                    </>
                                                )}
                                                <span>•</span>
                                                <span>
                                                    {new Date(
                                                        post.created_at,
                                                    ).toLocaleDateString()}
                                                </span>
                                                {post.is_pinned && (
                                                    <Pin className="w-3 h-3 text-yellow-500 ml-1" />
                                                )}
                                            </div>
                                        </div>
                                        <Badge
                                            className={getPostTypeColor(
                                                post.type,
                                            )}
                                        >
                                            {post.type.charAt(0).toUpperCase() +
                                                post.type.slice(1)}
                                        </Badge>
                                    </div>

                                    {post.title && (
                                        <h3 className="text-lg font-extrabold text-gray-900 mt-2">
                                            {post.title}
                                        </h3>
                                    )}

                                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                                        {post.content}
                                    </p>
                                </div>

                                {/* Post Stats */}
                                <div className="px-4 py-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            {totalReactions > 0 ? (
                                                <>
                                                    <div className="flex items-center -space-x-1">
                                                        {topReactions.map(
                                                            ([type]) => (
                                                                <span
                                                                    key={type}
                                                                    className="text-base"
                                                                >
                                                                    {
                                                                        REACTION_TYPES[
                                                                            type as ReactionType
                                                                        ]?.emoji
                                                                    }
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                    <span className="ml-1">
                                                        {totalReactions}
                                                    </span>
                                                </>
                                            ) : (
                                                <span>0 reactions</span>
                                            )}
                                        </div>
                                        <div>
                                            <span>
                                                {post.comments_count || 0}{" "}
                                                comments
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons with Click-Hold */}
                                <div className="px-2 py-1 border-t border-gray-100">
                                    <div className="flex">
                                        {/* Like Button with Click-Hold */}
                                        <div className="relative flex-1">
                                            <button
                                                ref={buttonRef}
                                                className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                                    isLiked
                                                        ? `${REACTION_TYPES[userReaction as ReactionType]?.bg} ${REACTION_TYPES[userReaction as ReactionType]?.color}`
                                                        : "text-gray-600 hover:bg-gray-100"
                                                }`}
                                                onMouseDown={(e) =>
                                                    handleMouseDown(
                                                        e,
                                                        post.post_id,
                                                    )
                                                }
                                                onMouseUp={(e) =>
                                                    handleMouseUp(
                                                        e,
                                                        post.post_id,
                                                    )
                                                }
                                                onMouseLeave={handleMouseLeave}
                                                onTouchStart={(e) =>
                                                    handleTouchStart(
                                                        e,
                                                        post.post_id,
                                                    )
                                                }
                                                onTouchEnd={(e) =>
                                                    handleTouchEnd(
                                                        e,
                                                        post.post_id,
                                                    )
                                                }
                                            >
                                                {isLiked ? (
                                                    <>
                                                        <span className="text-base">
                                                            {
                                                                REACTION_TYPES[
                                                                    userReaction as ReactionType
                                                                ]?.emoji
                                                            }
                                                        </span>
                                                        <span>
                                                            {
                                                                REACTION_TYPES[
                                                                    userReaction as ReactionType
                                                                ]?.label
                                                            }
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ThumbsUp className="w-4 h-4" />
                                                        Like
                                                    </>
                                                )}
                                            </button>

                                            {/* Reaction Picker - Shows above the button */}
                                            <ReactionPicker
                                                onSelect={(type) =>
                                                    handleReaction(
                                                        post.post_id,
                                                        type,
                                                    )
                                                }
                                                onClose={() =>
                                                    setActiveReactionPicker(
                                                        null,
                                                    )
                                                }
                                                currentReaction={
                                                    userReaction || undefined
                                                }
                                                isVisible={
                                                    activeReactionPicker ===
                                                    post.post_id
                                                }
                                                buttonRef={{
                                                    current:
                                                        buttonRefs.current.get(
                                                            post.post_id,
                                                        ) || null,
                                                }}
                                            />
                                        </div>

                                        {/* Comment Button */}
                                        <button
                                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                                showCommentDialog ===
                                                post.post_id
                                                    ? "text-blue-600 bg-blue-50"
                                                    : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                            onClick={() =>
                                                setShowCommentDialog(
                                                    showCommentDialog ===
                                                        post.post_id
                                                        ? null
                                                        : post.post_id,
                                                )
                                            }
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Comment
                                        </button>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                {showCommentDialog === post.post_id && (
                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Write a comment..."
                                                value={
                                                    commentInputs[
                                                        post.post_id
                                                    ] || ""
                                                }
                                                onChange={(e) =>
                                                    setCommentInputs(
                                                        (prev) => ({
                                                            ...prev,
                                                            [post.post_id]:
                                                                e.target.value,
                                                        }),
                                                    )
                                                }
                                                onKeyDown={(e) =>
                                                    e.key === "Enter" &&
                                                    handleComment(post.post_id)
                                                }
                                                className="flex-1 rounded-full bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleComment(post.post_id)
                                                }
                                                disabled={
                                                    !commentInputs[
                                                        post.post_id
                                                    ]?.trim()
                                                }
                                                className="bg-blue-600 hover:bg-blue-700 rounded-full px-4"
                                            >
                                                <Send className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setShowCommentDialog(null)
                                                }
                                                className="rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {post.comments &&
                                            post.comments.length > 0 && (
                                                <div className="mt-3 space-y-3 max-h-60 overflow-y-auto">
                                                    {post.comments
                                                        .slice(0, 5)
                                                        .map((comment) => (
                                                            <div
                                                                key={
                                                                    comment.comment_id
                                                                }
                                                                className="flex gap-3"
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                    {comment
                                                                        .user
                                                                        ?.first_name?.[0] ||
                                                                        "U"}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="bg-gray-100 rounded-2xl px-3 py-2">
                                                                        <p className="text-sm font-bold text-gray-900">
                                                                            {
                                                                                comment
                                                                                    .user
                                                                                    ?.first_name
                                                                            }{" "}
                                                                            {
                                                                                comment
                                                                                    .user
                                                                                    ?.last_name
                                                                            }
                                                                        </p>
                                                                        <p className="text-sm text-gray-700">
                                                                            {
                                                                                comment.content
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <p className="text-xs text-gray-400 mt-0.5 ml-1">
                                                                        {new Date(
                                                                            comment.created_at,
                                                                        ).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    {(post.comments_count ||
                                                        0) > 5 && (
                                                        <button className="text-sm font-bold text-blue-600 hover:underline">
                                                            View all{" "}
                                                            {
                                                                post.comments_count
                                                            }{" "}
                                                            comments
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {/* Load More */}
                <div ref={loadMoreRef} className="py-4 text-center">
                    {hasMore && (
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Timeline;
