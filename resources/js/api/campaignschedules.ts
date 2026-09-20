// resources/js/api/campaignschedules.ts
import axios from "./axios";

// ✅ Type definitions
export interface CampaignSchedule {
    schedule_id: number;
    election_id: number;
    section_id: number;
    start_time: string;
    end_time: string;
    candidate_id: number | null;
    notes: string | null;
    status: "pending" | "ongoing" | "completed" | "cancelled";
    created_by_user_id: number;
    created_at: string;
    updated_at: string;
    candidate?: {
        candidate_id: number;
        user_id: number;
        user?: {
            user_id: number;
            first_name: string;
            last_name: string;
        };
        position?: {
            position_id: number;
            title: string;
        };
    };
    section?: {
        section_id: number;
        section_code: string;
        section_name: string;
        year_level: number;
        course_id: number;
        course?: {
            course_id: number;
            course_code: string;
            course_name: string;
        };
    };
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export interface CreateScheduleData {
    section_id: number;
    start_time: string;
    end_time: string;
    candidate_id?: string | null;
    notes?: string;
}

export interface BulkCreateSchedulesData {
    schedules: CreateScheduleData[];
}

export interface UpdateScheduleData {
    section_id?: number;
    start_time?: string;
    end_time?: string;
    candidate_id?: string | null;
    notes?: string;
    status?: "pending" | "ongoing" | "completed" | "cancelled";
}

export interface PaginatedSchedulesResponse {
    data: CampaignSchedule[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const campaignScheduleAPI = {
    // ==================== GET METHODS (Public) ====================
    /**
     * Get all schedules for an election with pagination
     */
    getByElection: (
        electionId: number | string,
        page?: number,
        perPage?: number
    ): Promise<ApiResponse<PaginatedSchedulesResponse>> =>
        axios.get(`/campaign-schedules/election/${electionId}`, {
            params: { page, per_page: perPage || 20 }
        }),

    /**
     * Get schedules by course section
     */
    getByCourse: (
        electionId: number | string,
        courseSection: string
    ): Promise<ApiResponse<CampaignSchedule[]>> =>
        axios.get(`/campaign-schedules/course/${electionId}/${courseSection}`),

    /**
     * Get schedules for a specific candidate
     */
    getByCandidate: (
        candidateId: number
    ): Promise<ApiResponse<CampaignSchedule[]>> =>
        axios.get(`/campaign-schedules/candidate/${candidateId}`),

    // ==================== POST/PUT/DELETE METHODS (COMELEC only) ====================
    /**
     * Create a new campaign schedule
     */
    create: (
        electionId: number | string,
        data: CreateScheduleData
    ): Promise<ApiResponse<CampaignSchedule>> =>
        axios.post(`/comelec/campaign-schedules/election/${electionId}`, data),

    /**
     * Bulk create campaign schedules
     */
    bulkCreate: (
        electionId: number | string,
        schedules: BulkCreateSchedulesData
    ): Promise<ApiResponse<{ schedules: CampaignSchedule[] }>> =>
        axios.post(`/comelec/campaign-schedules/election/${electionId}/bulk`, schedules),

    /**
     * Update a campaign schedule
     */
    update: (
        id: number,
        data: UpdateScheduleData
    ): Promise<ApiResponse<CampaignSchedule>> =>
        axios.put(`/comelec/campaign-schedules/${id}`, data),

    /**
     * Delete a campaign schedule
     */
    delete: (id: number): Promise<ApiResponse<void>> =>
        axios.delete(`/comelec/campaign-schedules/${id}`),
};