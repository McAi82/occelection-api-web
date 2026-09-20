// resources/js/pages/Timeline/CandidateTimeline.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { campaignPostAPI, CampaignPost } from "../api/campaignPosts";
import { candidateAPI } from "../api/candidates";
import { RefreshButton } from "../components/common/RefreshButton";
import {
    MessageCircle,
    Heart,
    Lightbulb,
    ThumbsUp,
    Pin,
    Target,
    Building2,
    Send,
    X,
    Loader2,
    ArrowLeft,
    User,
    Award,
    GraduationCap,
    Mail,
    Sparkles,
    FileText,
    Clock,
} from "lucide-react";

interface Candidate {
    candidate_id: number;
    user_id: number;
    user?: {
        user_id: number;
        first_name: string;
        last_name: string;
        email: string;
        student_id: string;
        year_level: number;
        face_reference_photo?: string;
        course?: {
            course_code: string;
            course_name: string;
        };
    };
    position?: {
        position_id: number;
        title: string;
        category?: string;
    };
    partylist?: {
        partylist_id: number;
        name: string;
        description?: string;
        logo_url?: string;
    };
    platform?: string;
    qualifications?: string;
    is_approved: boolean;
}

const CandidateTimeline: React.FC = () => {
    const { candidateId } = useParams<{ candidateId: string }>();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [posts, setPosts] = useState<CampaignPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
    const [showCommentDialog, setShowCommentDialog] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [userRole, setUserRole] = useState<string>("voter");
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role || 'voter');
        setCurrentUserId(user.user_id || null);
        
        if (candidateId) {
            fetchCandidate(parseInt(candidateId));
            fetchPosts(1, true);
        }
    }, [candidateId]);

    useEffect(() => {
        if (page > 1) {
            fetchPosts(page);
        }
    }, [page]);

    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                setPage(prev => prev + 1);
            }
        });

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => observerRef.current?.disconnect();
    }, [hasMore, loading]);

    const fetchCandidate = async (id: number) => {
        try {
            const response = await candidateAPI.getById(id);
            const data = response.data;
            // Handle different response structures
            if (data.data) {
                setCandidate(data.data);
            } else {
                setCandidate(data);
            }
        } catch (error) {
            console.error("Failed to fetch candidate:", error);
            setError("Candidate not found");
        }
    };

    const fetchPosts = async (pageNum: number, reset = false) => {
        if (!candidateId) return;
        setLoading(true);
        try {
            const response = await campaignPostAPI.getCandidatePosts(parseInt(candidateId), pageNum);
            const result = response.data;
            let postsData = [];
            if (result.data && result.data.data) {
                postsData = result.data.data;
                setHasMore(!!result.data.next_page_url);
            } else if (Array.isArray(result.data)) {
                postsData = result.data;
                setHasMore(false);
            } else if (Array.isArray(result)) {
                postsData = result;
                setHasMore(false);
            }
            
            if (reset || pageNum === 1) {
                setPosts(postsData);
            } else {
                setPosts(prev => [...prev, ...postsData]);
            }
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
        fetchPosts(1, true);
    };

    const handleComment = async (postId: number) => {
        const content = commentInputs[postId]?.trim();
        if (!content) return;

        try {
            const response = await campaignPostAPI.addComment(postId, content);
            const newComment = response.data.data;
            
            setPosts(prev => prev.map(post => {
                if (post.post_id === postId) {
                    return {
                        ...post,
                        comments: [newComment, ...(post.comments || [])],
                        comments_count: (post.comments_count || 0) + 1,
                    };
                }
                return post;
            }));
            setCommentInputs(prev => ({ ...prev, [postId]: "" }));
            setShowCommentDialog(null);
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    };

    const handleReaction = async (postId: number, type: 'like' | 'insightful' | 'helpful') => {
        try {
            const response = await campaignPostAPI.addReaction(postId, type);
            const reaction = response.data.data;
            
            setPosts(prev => prev.map(post => {
                if (post.post_id === postId) {
                    const filteredReactions = (post.reactions || []).filter(r => r.user_id !== reaction.user_id);
                    return {
                        ...post,
                        reactions: [...filteredReactions, reaction],
                        user_reaction: reaction,
                    };
                }
                return post;
            }));
        } catch (error) {
            console.error("Failed to add reaction:", error);
        }
    };

    const handleRemoveReaction = async (postId: number) => {
        try {
            await campaignPostAPI.removeReaction(postId);
            setPosts(prev => prev.map(post => {
                if (post.post_id === postId) {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    return {
                        ...post,
                        reactions: (post.reactions || []).filter(r => r.user_id !== user.user_id),
                        user_reaction: undefined,
                    };
                }
                return post;
            }));
        } catch (error) {
            console.error("Failed to remove reaction:", error);
        }
    };

    const getReactionIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart className="w-4 h-4" />;
            case 'insightful': return <Lightbulb className="w-4 h-4" />;
            case 'helpful': return <ThumbsUp className="w-4 h-4" />;
            default: return <Heart className="w-4 h-4" />;
        }
    };

    const getPostTypeColor = (type: string) => {
        switch (type) {
            case 'survey': return 'bg-purple-100 text-purple-700';
            case 'announcement': return 'bg-blue-100 text-blue-700';
            case 'update': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getImageUrl = (path?: string): string | null => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        if (path.startsWith("/storage")) return path;
        return `${path}`;
    };

    const isOwnProfile = currentUserId === candidate?.user_id;

    if (loading && page === 1) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <div className="flex items-center justify-center mb-4">
                    <User className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Candidate Not Found</h2>
                <p className="text-gray-500 mb-4">{error || "The candidate you're looking for does not exist."}</p>
                <Button onClick={() => navigate("/candidates")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Candidates
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/candidates")} className="-ml-2">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Candidates
                </Button>
            </div>

            {/* Candidate Profile Card */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-blue-600 px-6 py-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <Avatar className="w-24 h-24 ring-4 ring-white/30 shadow-xl">
                            <AvatarImage src={getImageUrl(candidate.user?.face_reference_photo) || undefined} />
                            <AvatarFallback className="bg-blue-500 text-white text-2xl font-bold">
                                {candidate.user?.first_name?.[0]}{candidate.user?.last_name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-center md:text-left text-white">
                            <h1 className="text-2xl font-bold">
                                {candidate.user?.first_name} {candidate.user?.last_name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                                <Badge className="bg-white/20 text-white border-0">
                                    <Award className="w-3 h-3 mr-1" />
                                    {candidate.position?.title || "Candidate"}
                                </Badge>
                                {candidate.partylist && (
                                    <Badge className="bg-white/20 text-white border-0">
                                        <Building2 className="w-3 h-3 mr-1" />
                                        {candidate.partylist.name}
                                    </Badge>
                                )}
                                {candidate.is_approved ? (
                                    <Badge className="bg-green-500/30 text-white border-0">
                                        Approved
                                    </Badge>
                                ) : (
                                    <Badge className="bg-yellow-500/30 text-white border-0">
                                        Pending
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-sm text-blue-100">
                                <span className="flex items-center gap-1">
                                    <GraduationCap className="w-4 h-4" />
                                    {candidate.user?.course?.course_code || "N/A"} - Year {candidate.user?.year_level || "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {candidate.user?.email}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    ID: {candidate.user?.student_id}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 text-white border-0">
                                <Sparkles className="w-3 h-3 mr-1" />
                                {posts.length} Posts
                            </Badge>
                        </div>
                    </div>
                </div>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {candidate.platform && (
                            <div className="p-4 bg-blue-50 rounded-xl">
                                <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-blue-600" />
                                    Platform
                                </h4>
                                <p className="text-sm text-gray-700">{candidate.platform}</p>
                            </div>
                        )}
                        {candidate.qualifications && (
                            <div className="p-4 bg-purple-50 rounded-xl">
                                <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-purple-600" />
                                    Qualifications
                                </h4>
                                <p className="text-sm text-gray-700">{candidate.qualifications}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Posts Feed */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                        {candidate.user?.first_name}'s Posts
                    </h2>
                    <RefreshButton onClick={handleRefresh} isLoading={refreshing} />
                </div>

                <div className="space-y-4">
                    {posts.length === 0 ? (
                        <Card className="text-center py-12">
                            <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500">No posts yet from this candidate</p>
                            {isOwnProfile && (
                                <Button
                                    variant="link"
                                    onClick={() => navigate("/timeline")}
                                    className="mt-2"
                                >
                                    Create your first post
                                </Button>
                            )}
                        </Card>
                    ) : (
                        posts.map((post) => (
                            <Card key={post.post_id} className="border-0 shadow-lg rounded-xl overflow-hidden">
                                <CardContent className="p-6">
                                    {/* Post Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={getImageUrl(candidate.user?.face_reference_photo) || ''} />
                                                <AvatarFallback className="bg-blue-500 text-white">
                                                    {candidate.user?.first_name?.[0] || 'C'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {candidate.user?.first_name} {candidate.user?.last_name}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span>{candidate.position?.title || 'Candidate'}</span>
                                                    {candidate.partylist && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Building2 className="w-3 h-3" />
                                                                {candidate.partylist.name}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={getPostTypeColor(post.type)}>
                                                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                                            </Badge>
                                            {post.is_pinned && <Pin className="w-4 h-4 text-yellow-500" />}
                                            <span className="text-xs text-gray-400">
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Post Content */}
                                    {post.title && (
                                        <h3 className="text-lg font-semibold text-gray-900 mt-3">{post.title}</h3>
                                    )}
                                    <p className="text-gray-700 mt-2 whitespace-pre-wrap">{post.content}</p>

                                    {/* Post Stats */}
                                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <MessageCircle className="w-4 h-4" />
                                            {post.comments_count || 0} comments
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Heart className="w-4 h-4" />
                                            {(post.reactions || []).length} reactions
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Reactions */}
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                        <Button
                                            variant={post.user_reaction ? "default" : "outline"}
                                            size="sm"
                                            className={`gap-1 ${post.user_reaction ? 'bg-red-100 text-red-600 hover:bg-red-200' : ''}`}
                                            onClick={() => {
                                                if (post.user_reaction) {
                                                    if (post.user_reaction.type === 'like') {
                                                        handleRemoveReaction(post.post_id);
                                                    } else {
                                                        handleReaction(post.post_id, 'like');
                                                    }
                                                } else {
                                                    handleReaction(post.post_id, 'like');
                                                }
                                            }}
                                        >
                                            <Heart className="w-4 h-4" />
                                            Like
                                        </Button>
                                        <Button
                                            variant={post.user_reaction?.type === 'insightful' ? "default" : "outline"}
                                            size="sm"
                                            className={`gap-1 ${post.user_reaction?.type === 'insightful' ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : ''}`}
                                            onClick={() => handleReaction(post.post_id, 'insightful')}
                                        >
                                            <Lightbulb className="w-4 h-4" />
                                            Insightful
                                        </Button>
                                        <Button
                                            variant={post.user_reaction?.type === 'helpful' ? "default" : "outline"}
                                            size="sm"
                                            className={`gap-1 ${post.user_reaction?.type === 'helpful' ? 'bg-green-100 text-green-600 hover:bg-green-200' : ''}`}
                                            onClick={() => handleReaction(post.post_id, 'helpful')}
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                            Helpful
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1 ml-auto"
                                            onClick={() => setShowCommentDialog(post.post_id)}
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Comment
                                        </Button>
                                    </div>

                                    {/* Comments */}
                                    {showCommentDialog === post.post_id && (
                                        <div className="mt-4 pt-4 border-t">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Write a comment..."
                                                    value={commentInputs[post.post_id] || ''}
                                                    onChange={(e) => setCommentInputs(prev => ({
                                                        ...prev,
                                                        [post.post_id]: e.target.value
                                                    }))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleComment(post.post_id);
                                                        }
                                                    }}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleComment(post.post_id)}
                                                    disabled={!commentInputs[post.post_id]?.trim()}
                                                    className="bg-blue-600"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setShowCommentDialog(null)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {post.comments && post.comments.length > 0 && (
                                                <div className="mt-3 space-y-3 max-h-60 overflow-y-auto">
                                                    {post.comments.slice(0, 5).map((comment) => (
                                                        <div key={comment.comment_id} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                                                            <Avatar className="w-8 h-8">
                                                                <AvatarImage src={comment.user?.face_reference_photo || ''} />
                                                                <AvatarFallback className="bg-gray-400 text-white text-xs">
                                                                    {comment.user?.first_name?.[0] || 'U'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {comment.user?.first_name} {comment.user?.last_name}
                                                                </p>
                                                                <p className="text-sm text-gray-700">{comment.content}</p>
                                                                <p className="text-xs text-gray-400">
                                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(post.comments_count || 0) > 5 && (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="text-blue-600"
                                                        >
                                                            View all {post.comments_count} comments
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}

                    {/* Load More */}
                    <div ref={loadMoreRef} className="py-4 text-center">
                        {hasMore && (
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateTimeline;