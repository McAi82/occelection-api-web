// src/pages/Admin/LiveCommentsModeration.tsx
import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import { commentAPI } from "../api/comments";
import { electionAPI } from "../api/elections";
import {
    Trash2,
    Eye,
    EyeOff,
    Search,
    Loader2,
    RefreshCw,MessageCircle,
    AlertCircle,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
}

interface Comment {
    comment_id: number;
    election_id: number;
    user_id: number;
    comment_text: string;
    is_visible: boolean;
    created_at: string;
    user?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

const LiveCommentsModeration: React.FC = () => {
    const [elections, setElections] = useState<Election[]>([]);
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [comments, setComments] = useState<Comment[]>([]);
    const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchElections();
    }, []);

    useEffect(() => {
        if (selectedElection) {
            fetchComments();
        }
    }, [selectedElection]);

    useEffect(() => {
        filterComments();
    }, [searchTerm, comments]);

    const fetchElections = async (): Promise<void> => {
        try {
            const response = await electionAPI.getAll();
            setElections(response.data || []);
            if (response.data && response.data.length > 0) {
                setSelectedElection(response.data[0].election_id.toString());
            }
        } catch (error) {
            console.error("Failed to fetch elections:", error);
            setError("Failed to load elections");
        }
    };

    const fetchComments = async (): Promise<void> => {
        setLoading(true);
        setError("");
        try {
            const response = await commentAPI.getByElection(selectedElection);
            setComments(response.data || []);
            setFilteredComments(response.data || []);
            console.log("Fetched comments:", response.data);
        } catch (error: any) {
            console.error("Failed to fetch comments:", error);
            setError(
                error.response?.data?.message || "Failed to load comments",
            );
        } finally {
            setLoading(false);
        }
    };

    const filterComments = (): void => {
        if (!searchTerm) {
            setFilteredComments(comments);
        } else {
            const filtered = comments.filter(
                (comment) =>
                    comment.comment_text
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    comment.user?.first_name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    comment.user?.last_name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            );
            setFilteredComments(filtered);
        }
    };

    const handleModerate = async (
        commentId: number,
        isVisible: boolean,
    ): Promise<void> => {
        try {
            await commentAPI.moderate(commentId, isVisible);
            fetchComments();
        } catch (error) {
            console.error("Failed to moderate comment:", error);
            setError("Failed to moderate comment");
        }
    };

    const handleDelete = async (commentId: number): Promise<void> => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            try {
                await commentAPI.delete(commentId);
                fetchComments();
            } catch (error) {
                console.error("Failed to delete comment:", error);
                setError("Failed to delete comment");
            }
        }
    };

    const visibleComments = filteredComments.filter((c) => c.is_visible);
    const hiddenComments = filteredComments.filter((c) => !c.is_visible);
    console.log(visibleComments, hiddenComments);

    if (loading && !comments.length) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Live Comments Moderation
                    </h1>
                    <p className="text-gray-600">
                        Monitor and moderate real-time comments from voters
                    </p>
                </div>
                <Button variant="outline" onClick={fetchComments}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-600">{error}</span>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Select Election</CardTitle>
                </CardHeader>
                <CardContent>
                    <select
                        className="w-full md:w-64 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedElection}
                        onChange={(e) => setSelectedElection(e.target.value)}
                    >
                        {elections.map((election) => (
                            <option
                                key={election.election_id}
                                value={election.election_id}
                            >
                                {election.title}
                            </option>
                        ))}
                    </select>
                </CardContent>
            </Card>
            {/* ===== STATS - PILL/BADGE STYLE ===== */}
<div className="flex flex-wrap items-center gap-3 py-1">
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
        <MessageCircle className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-600">Total</span>
        <span className="text-sm font-bold text-gray-900">{comments.length}</span>
    </div>
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
        <Eye className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">Visible</span>
        <span className="text-sm font-bold text-green-800">{visibleComments.length}</span>
    </div>
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
        <EyeOff className="w-4 h-4 text-red-600" />
        <span className="text-sm font-medium text-red-700">Hidden</span>
        <span className="text-sm font-bold text-red-800">{hiddenComments.length}</span>
    </div>
</div>

            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search comments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visible Comments */}
                <Card>
                    <CardHeader className="bg-green-50">
                        <CardTitle className="flex items-center text-green-800">
                            <Eye className="w-5 h-5 mr-2" />
                            Visible Comments ({visibleComments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                        {visibleComments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No visible comments
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {visibleComments.map((comment) => (
                                    <div
                                        key={comment.comment_id}
                                        className="border rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                                                        {
                                                            comment.user
                                                                ?.first_name?.[0]
                                                        }
                                                        {
                                                            comment.user
                                                                ?.last_name?.[0]
                                                        }
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {
                                                            comment.user
                                                                ?.first_name
                                                        }{" "}
                                                        {
                                                            comment.user
                                                                ?.last_name
                                                        }
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(
                                                            comment.created_at,
                                                        ).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleModerate(
                                                            comment.comment_id,
                                                            false,
                                                        )
                                                    }
                                                >
                                                    <EyeOff className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(
                                                            comment.comment_id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-gray-700">
                                            {comment.comment_text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Hidden Comments */}
                <Card>
                    <CardHeader className="bg-red-50">
                        <CardTitle className="flex items-center text-red-800">
                            <EyeOff className="w-5 h-5 mr-2" />
                            Hidden Comments ({hiddenComments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                        {hiddenComments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No hidden comments
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {hiddenComments.map((comment) => (
                                    <div
                                        key={comment.comment_id}
                                        className="border rounded-lg p-4 bg-gray-50"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback className="bg-gray-500 text-white text-xs">
                                                        {
                                                            comment.user
                                                                ?.first_name?.[0]
                                                        }
                                                        {
                                                            comment.user
                                                                ?.last_name?.[0]
                                                        }
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-500">
                                                        {
                                                            comment.user
                                                                ?.first_name
                                                        }{" "}
                                                        {
                                                            comment.user
                                                                ?.last_name
                                                        }
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(
                                                            comment.created_at,
                                                        ).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleModerate(
                                                            comment.comment_id,
                                                            true,
                                                        )
                                                    }
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(
                                                            comment.comment_id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-gray-400 italic">
                                            [Hidden Comment] -{" "}
                                            {comment.comment_text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LiveCommentsModeration;
