// resources/js/api/feedback.ts
import axios from "./axios";
import { ApiResponse, Feedback, FeedbackCategory } from "../types";

export interface CreateFeedbackData {
    election_id: string;
    category_id?: string;
    rating: number;
    title: string;
    comment: string;
    is_public: boolean;
    is_anonymous: boolean;
}

export interface UpdateFeedbackData {
    category_id?: string;
    rating: number;
    title: string;
    comment: string;
    is_public: boolean;
    is_anonymous: boolean;
}

export const feedbackAPI = {
    // ✅ Get all public feedback
    getAll: (
        params?: Record<string, unknown>,
    ): Promise<ApiResponse<Feedback[]>> => axios.get("/feedback", { params }),

    // ✅ Get categories
    getCategories: (): Promise<ApiResponse<FeedbackCategory[]>> =>
        axios.get("/feedback/categories"),

    // ✅ Check if user has submitted feedback for an election
    checkStatus: (
        electionId: number,
    ): Promise<
        ApiResponse<{
            has_submitted: boolean;
            feedback: Feedback | null;
            can_edit: boolean;
            can_delete: boolean;
        }>
    > => axios.get(`/feedback/check/${electionId}`),

    // ✅ Get user's feedback for a specific election
    getUserFeedback: (
        electionId: number,
    ): Promise<
        ApiResponse<{ data: Feedback | null; has_submitted: boolean }>
    > => axios.get(`/feedback/my/${electionId}`),

    // ✅ Create feedback
    create: (data: CreateFeedbackData): Promise<ApiResponse<Feedback>> =>
        axios.post("/feedback", data),

    // ✅ Update feedback
    update: (
        id: number,
        data: UpdateFeedbackData,
    ): Promise<ApiResponse<Feedback>> => axios.put(`/feedback/${id}`, data),

    // ✅ Delete feedback
    delete: (id: number): Promise<ApiResponse<void>> =>
        axios.delete(`/feedback/${id}`),

    // ✅ Mark as helpful
    markHelpful: (
        id: number,
    ): Promise<ApiResponse<{ helpful_count: number }>> =>
        axios.post(`/feedback/${id}/helpful`),

    // ✅ Admin: Get all feedback
    adminGetAll: (
        params?: Record<string, unknown>,
    ): Promise<ApiResponse<Feedback[]>> =>
        axios.get("/admin/feedback", { params }),

    // ✅ Admin: Respond to feedback
    adminRespond: (
        id: number,
        adminResponse: string,
    ): Promise<ApiResponse<Feedback>> =>
        axios.post(`/admin/feedback/${id}/respond`, {
            admin_response: adminResponse,
        }),
};
