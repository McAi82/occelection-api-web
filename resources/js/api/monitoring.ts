// resources/js/api/monitoring.ts
import axios from "./axios";
import {
    ApiResponse,
    MonitoringData,
    AuditLog,
    LiveResults,
    TurnoutReport,
} from "../types";

export const monitoringAPI = {
    getDashboard: (
        electionId: number | string,
    ): Promise<ApiResponse<MonitoringData>> =>
        axios.get(`/monitoring/dashboard/${electionId}`),

    // ✅ Updated audit trail methods
    getAuditTrail: (
        electionId?: number | string,
        params?: Record<string, unknown>,
    ): Promise<ApiResponse<{ data: any; stats?: any }>> => {
        const url = electionId
            ? `/monitoring/audit-trail/${electionId}`
            : "/monitoring/audit-trail/all";
        return axios.get(url, { params });
    },

    getAllAuditTrail: (
        params?: Record<string, unknown>,
    ): Promise<ApiResponse<{ data: any; stats: any }>> =>
        axios.get("/monitoring/audit-trail/all", { params }),

    getUserAuditTrail: (
        userId: number,
        params?: Record<string, unknown>,
    ): Promise<ApiResponse<{ data: any }>> =>
        axios.get(`/monitoring/audit-trail/user/${userId}`, { params }),

    getLiveResults: (
        electionId: number | string,
    ): Promise<ApiResponse<LiveResults>> =>
        axios.get(`/monitoring/results/${electionId}`),

    getTurnout: (
        electionId: number | string,
    ): Promise<ApiResponse<TurnoutReport>> =>
        axios.get(`/monitoring/turnout/${electionId}`),

    getVoterStatus: (
        electionId: number | string,
    ): Promise<
        ApiResponse<{ voters: unknown[]; total: number; voted: number }>
    > => axios.get(`/monitoring/voters/${electionId}`),

    getPositionProgress: (
        electionId: number | string,
    ): Promise<
        ApiResponse<
            Array<{
                position_id: number;
                title: string;
                total_candidates: number;
                votes_cast: number;
                progress_percentage: number;
            }>
        >
    > => axios.get(`/monitoring/positions/${electionId}`),

    getStatistics: (
        electionId: number | string,
    ): Promise<
        ApiResponse<{
            total_voters: number;
            voted_count: number;
            turnout_percentage: number;
            remaining_voters: number;
        }>
    > => axios.get(`/monitoring/statistics/${electionId}`),

    getRealtimeUpdates: (
        electionId: number | string,
    ): Promise<
        ApiResponse<{
            votes_cast: number;
            turnout_percentage: number;
            last_updated: string;
        }>
    > => axios.get(`/monitoring/realtime/${electionId}`),

    refreshData: (
        electionId: number | string,
    ): Promise<ApiResponse<{ message: string }>> =>
        axios.post(`/monitoring/refresh/${electionId}`),
};
