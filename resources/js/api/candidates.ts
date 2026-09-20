// src/api/candidates.ts
import axios from "./axios";
import { Candidate, ApiResponse } from "../types";

export interface ApplyCandidateData {
    position_id: number;
    partylist_id?: number;
    platform?: string;
    qualifications?: string;
    photo_url?: File | null;
}

export interface CandidateStats {
    total_votes: number;
    rank?: number;
    vote_percentage?: number;
}

export const candidateAPI = {
    getByElection: (
        electionId: number | string,
    ): Promise<ApiResponse<Candidate[]>> =>
        axios.get(`/candidates/election/${electionId}`),

    getById: (candidateId: number | string): Promise<ApiResponse<Candidate>> =>
        axios.get(`/candidates/${candidateId}`),

    apply: (
        electionId: number | string,
        data: ApplyCandidateData,
    ): Promise<ApiResponse<Candidate>> =>
        axios.post(`/candidates/apply/${electionId}`, data, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    update: (
        candidateId: number,
        data: Partial<ApplyCandidateData>,
    ): Promise<ApiResponse<Candidate>> =>
        axios.put(`/candidates/${candidateId}`, data),

    getStats: (candidateId: number): Promise<ApiResponse<CandidateStats>> =>
        axios.get(`/candidates/${candidateId}/stats`),
};
