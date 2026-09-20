// resources/js/api/campaignPosts.ts
import axios from "./axios";

export interface CampaignPost {
    post_id: number;
    candidate_id: number;
    election_id: number;
    content: string;
    title?: string;
    type: "survey" | "announcement" | "update";
    is_pinned: boolean;
    is_active: boolean;
    views: number;
    created_at: string;
    updated_at: string;
    candidate?: {
        candidate_id: number;
        user: {
            user_id: number;
            first_name: string;
            last_name: string;
            face_reference_photo?: string;
        };
        position?: {
            title: string;
        };
        partylist?: {
            name: string;
        };
    };
    comments?: PostComment[];
    reactions?: PostReaction[];
    comments_count?: number;
    reactions_count?: number;
    user_reaction?: PostReaction;
}

export interface PostComment {
    comment_id: number;
    post_id: number;
    user_id: number;
    content: string;
    is_visible: boolean;
    created_at: string;
    user?: {
        user_id: number;
        first_name: string;
        last_name: string;
        face_reference_photo?: string;
    };
}

export interface PostReaction {
    reaction_id: number;
    post_id: number;
    user_id: number;
    type:
        | "like"
        | "heart"
        | "laugh"
        | "wow"
        | "sad"
        | "angry"
        | "insightful"
        | "helpful";
    created_at: string;
}

export interface CreatePostData {
    election_id: number;
    content: string;
    title?: string;
    type?: "survey" | "announcement" | "update";
    is_pinned?: boolean;
}

export const campaignPostAPI = {
    // Get posts for election
    getPosts: (electionId: number, page?: number): Promise<{ data: any }> =>
        axios.get(`/campaign-posts/election/${electionId}`, {
            params: { page, per_page: 20 },
        }),

    // Get posts by candidate
    getCandidatePosts: (
        candidateId: number,
        page?: number,
    ): Promise<{ data: any }> =>
        axios.get(`/campaign-posts/candidate/${candidateId}`, {
            params: { page, per_page: 20 },
        }),

    // Create post
    createPost: (
        data: CreatePostData,
    ): Promise<{ data: { data: CampaignPost } }> =>
        axios.post("/campaign-posts", data),

    // Update post
    updatePost: (
        postId: number,
        data: Partial<CreatePostData>,
    ): Promise<{ data: { data: CampaignPost } }> =>
        axios.put(`/campaign-posts/${postId}`, data),

    // Delete post
    deletePost: (postId: number): Promise<{ data: any }> =>
        axios.delete(`/campaign-posts/${postId}`),

    // Comments
    addComment: (
        postId: number,
        content: string,
    ): Promise<{ data: { data: PostComment } }> =>
        axios.post(`/campaign-posts/${postId}/comments`, { content }),

    deleteComment: (commentId: number): Promise<{ data: any }> =>
        axios.delete(`/campaign-posts/comments/${commentId}`),

    // ✅ Reactions - Updated to accept all reaction types
    addReaction: (
        postId: number,
        type:
            | "like"
            | "heart"
            | "laugh"
            | "wow"
            | "sad"
            | "angry"
            | "insightful"
            | "helpful",
    ): Promise<{ data: { data: PostReaction } }> =>
        axios.post(`/campaign-posts/${postId}/reactions`, { type }),

    removeReaction: (postId: number): Promise<{ data: any }> =>
        axios.delete(`/campaign-posts/${postId}/reactions`),
};
