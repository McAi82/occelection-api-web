// resources/js/api/partylists.ts
import axios from "./axios";

export interface Partylist {
    partylist_id: number;
    name: string;
    description?: string;
    logo_url?: string;
    candidates_count?: number;
    election_id: number;
    created_by_user_id?: number;
    created_at?: string;
    creator?: {
        user_id: number;
        first_name: string;
        last_name: string;
        email?: string;
        student_id?: string;
    };
    active_memberships?: Array<{
        membership_id: number;
        status: string;
        approved_at?: string;
        candidate: {
            candidate_id: number;
            user: {
                user_id: number;
                first_name: string;
                last_name: string;
                email?: string;
                student_id?: string;
                course?: {
                    course_code: string;
                    course_name: string;
                };
                year_level?: number;
                face_reference_photo?: string;
            };
            position?: {
                position_id: number;
                title: string;
                category?: string;
            };
        };
    }>;
    election?: {
        election_id: number;
        title: string;
        election_type: string;
        year: number;
        voting_start: string;
        voting_end: string;
        course?: {
            course_id: number;
            course_code: string;
            course_name: string;
        };
    };
}

export const partylistAPI = {
    // ✅ GET /partylists/years - Get available years from database
    getAvailableYears: () => {
        return axios.get('/partylists/years');
    },
    
    // ✅ GET /partylists?year=2024 - Get partylists by year
    getByYear: (year: number) => {
        return axios.get(`/partylists?year=${year}`);
    },
    
    // ✅ GET /partylists?year=2024&election_id=1 - Get partylists by year and election
    getAll: (year?: number, electionId?: string | number) => {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (electionId) params.append('election_id', electionId.toString());
        return axios.get(`/partylists?${params.toString()}`);
    },
    
    // ✅ GET /partylists/{id} - Get single partylist details
    getById: (id: number) => {
        return axios.get(`/partylists/${id}`);
    },
    
    // ✅ GET /partylists/election/{electionId}?year=2024 - Get by election with year
    getByElection: (electionId: string | number, year?: number) => {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        return axios.get(`/partylists/election/${electionId}?${params.toString()}`);
    },
    
    // ✅ GET /partylists/current-year - Get current year partylists (for application form)
    getCurrentYear: (electionId?: number) => {
        const params = new URLSearchParams();
        if (electionId) params.append('election_id', electionId.toString());
        return axios.get(`/partylists/current-year?${params.toString()}`);
    },
};