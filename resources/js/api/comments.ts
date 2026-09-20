// src/api/comments.ts
import axios from "./axios";
import { Comment, ApiResponse } from "../types";

export interface CreateCommentData {
    election_id: number | string;
    comment_text: string;
}

export const commentAPI = {
    getByElection: (
        electionId: number | string,
    ): Promise<ApiResponse<Comment[]>> =>
        axios.get(`/comments/election/${electionId}`),

    create: (data: CreateCommentData): Promise<ApiResponse<Comment>> =>
        axios.post("/comments", data),

    moderate: (
        commentId: number,
        isVisible: boolean,
    ): Promise<ApiResponse<Comment>> =>
        axios.put(`/comments/${commentId}/moderate`, { is_visible: isVisible }),

    delete: (commentId: number): Promise<ApiResponse<void>> =>
        axios.delete(`/comments/${commentId}`),
};
