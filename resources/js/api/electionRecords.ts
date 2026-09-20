// resources/js/api/electionRecords.ts
import axios from "./axios";

export interface ElectionRecord {
    election_id: number;
    title: string;
    election_type: 'CSG' | 'SBO';
    description: string | null;
    voting_start: string;
    voting_end: string;
    created_at: string;
    status: 'upcoming' | 'ongoing' | 'ended';
    positions_count: number;
    candidates_count: number;
    voters_total: number;
    voters_voted: number;
    turnout_percentage: number;
    has_results: boolean;
    course?: {
        course_id: number;
        course_code: string;
        course_name: string;
    };
}

export interface ElectionRecordDetail extends ElectionRecord {
    positions: Array<{
        position_id: number;
        title: string;
        category: string;
        candidates: Array<{
            candidate_id: number;
            user_id: number;
            first_name: string;
            last_name: string;
            student_id: string;
            partylist_name: string | null;
            votes: number;
            winner: boolean;
        }>;
    }>;
    voters_list: Array<{
        voter_registry_id: number;
        user_id: number;
        first_name: string;
        last_name: string;
        student_id: string;
        has_voted: boolean;
        voted_at: string | null;
    }>;
    partylists: Array<{
        partylist_id: number;
        name: string;
        description: string | null;
        logo_url: string | null;
        candidates_count: number;
    }>;
    timeline: Array<{
        date: string;
        event: string;
        description: string;
    }>;
}

export interface FolderRecord {
    year: number;
    elections: ElectionRecord[];
    total_elections: number;
    total_voters: number;
    total_votes_cast: number;
    avg_turnout: number;
}

export interface YearlyStats {
    year: number;
    elections_count: number;
    total_voters: number;
    total_votes_cast: number;
    avg_turnout: number;
    csg_count: number;
    sbo_count: number;
}

export const electionRecordsAPI = {
    // Get all years with records
    getYears: (): Promise<{ data: number[] }> =>
        axios.get("/admin/records/years"),

    // Get records for a specific year
    getYearRecords: (year: number): Promise<{ data: FolderRecord }> =>
        axios.get(`/admin/records/year/${year}`),

    // Get all yearly statistics
    getYearlyStats: (): Promise<{ data: YearlyStats[] }> =>
        axios.get("/admin/records/stats"),

    // Get detailed election record
    getElectionDetail: (electionId: number): Promise<{ data: ElectionRecordDetail }> =>
        axios.get(`/admin/records/election/${electionId}`),

    // Export records (CSV/PDF)
    exportYearRecords: (year: number, format: 'csv' | 'pdf'): Promise<Blob> =>
        axios.get(`/admin/records/export/${year}`, {
            params: { format },
            responseType: 'blob',
        }),

    // Export single election
    exportElection: (electionId: number, format: 'csv' | 'pdf'): Promise<Blob> =>
        axios.get(`/admin/records/election/${electionId}/export`, {
            params: { format },
            responseType: 'blob',
        }),
};