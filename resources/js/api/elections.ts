// resources/js/api/elections.ts
import axios from "./axios";
import {
    Election,
    ApiResponse,
    LiveResults,
    Position,
    Partylist,
} from "../types";

// ✅ FIX: Don't extend Election, create a separate interface
export interface ElectionDetails {
    election_id: number;
    title: string;
    election_type: "CSG" | "SBO";
    description?: string;
    voting_start: string;
    voting_end: string;
    course_id?: number;
    course?: Course;
    is_active?: boolean;
    is_ongoing?: boolean;
    positions?: Position[];
    partylists?: Partylist[];
    total_voters?: number;
    votes_cast?: number;
}

// Course interface if needed
interface Course {
    course_id: number;
    course_code: string;
    course_name: string;
    department?: string;
    is_active?: boolean;
}

// Local interface for results that matches your API
export interface ElectionResultsData {
    data: ElectionResultsData | undefined;
    election: Election;
    results: Record<
        string,
        Array<{
            candidate: {
                candidate_id: number;
                user?: { first_name: string; last_name: string };
                partylist?: { name: string };
            };
            votes: number;
        }>
    >;
}

export interface Winner {
    position_id: number;
    position_title: string;
    position_category?: string;
    candidate_id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    student_id: string;
    email: string;
    course: string;
    year_level: number;
    face_reference_photo?: string;
    partylist_id?: number;
    partylist_name?: string;
    votes: number;
    total_votes: number;
    percentage: number;
    is_winner: boolean;
    rank: number;
}

export const electionAPI = {
    getAll: (): Promise<ApiResponse<Election[]>> => axios.get("/elections"),

    getActive: (): Promise<ApiResponse<Election>> =>
        axios.get("/elections/active"),

    getById: (id: number | string): Promise<ApiResponse<ElectionDetails>> =>
        axios.get(`/elections/${id}`),

    getLiveResults: (id: number | string): Promise<ApiResponse<LiveResults>> =>
        axios.get(`/elections/${id}/live-results`),

    getResults: (
        id: number | string,
    ): Promise<ApiResponse<ElectionResultsData>> =>
        axios.get(`/elections/${id}/results`),

        getWinners: (id: number | string): Promise<ApiResponse<Winner[]>> =>
        axios.get(`/elections/${id}/winners`),
};
