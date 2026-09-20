// resources/js/api/comelec.ts
import axios from "./axios";

export interface AddBulkCandidatesData {
    election_id: number;
    candidates: Array<{
        user_id: number;
        position_id: number;
        partylist_id?: number | null;
    }>;
}

export const comelecAPI = {
    getUsers: () => axios.get("/comelec/users"),
    // Candidate Management
    getAllCandidates: (params?: Record<string, unknown>) =>
        axios.get("/comelec/candidates", { params }),
    addCandidate: (data: any) => axios.post("/comelec/candidates/add", data),
    addBulkCandidates: (data: AddBulkCandidatesData) =>
        axios.post("/comelec/candidates/bulk-add", data),
    removeCandidate: (candidateId: number) =>
        axios.delete(`/comelec/candidates/${candidateId}`),
    updateCandidate: (id: number, data: any) =>
        axios.put(`/comelec/candidates/${id}`, data),

    // Campaign Schedule Management
    createSchedule: (electionId: number | string, data: any) =>
        axios.post(`/comelec/campaign-schedules/election/${electionId}`, data),
    bulkCreateSchedules: (electionId: number | string, data: any) =>
        axios.post(`/comelec/campaign-schedules/election/${electionId}/bulk`, data),
    updateSchedule: (id: number, data: any) =>
        axios.put(`/comelec/campaign-schedules/${id}`, data),
    deleteSchedule: (id: number) =>
        axios.delete(`/comelec/campaign-schedules/${id}`),
};