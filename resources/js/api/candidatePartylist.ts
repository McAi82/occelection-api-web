// resources/js/api/candidatePartylist.ts
import axios from "./axios";

export interface Partylist {
    partylist_id: number;
    election_id: number;
    name: string;
    description?: string;
    logo_url?: string;
    created_by_user_id: number;
    candidates_count: number;
    is_creator: boolean;
    is_member: boolean;
    has_pending_request: boolean;
    request_id?: number;
    creator?: {
        user_id: number;
        first_name: string;
        last_name: string;
    };
    active_memberships?: Array<{
        membership_id: number;
        candidate_id: number;
        status: string;
        candidate: {
            candidate_id: number;
            user: {
                first_name: string;
                last_name: string;
            };
        };
    }>;
}

export interface PartylistMembership {
    membership_id: number;
    partylist_id: number;
    candidate_id: number;
    status: "pending" | "approved" | "rejected";
    approved_at: string | null;
    approved_by_user_id: number | null;
    is_active: boolean;
    created_at: string;
    candidate: {
        candidate_id: number;
        user: {
            user_id: number;
            first_name: string;
            last_name: string;
            email: string;
            student_id: string;
        };
        position: {
            title: string;
        };
    };
}

export const candidatePartylistAPI = {
    // Get available partylists for a candidate to join
    getAvailableLists: (electionId: number) =>
        axios.get(`/candidate/partylists/available/${electionId}`),

    // Create a new partylist (only highest position)
    create: (formData: FormData) =>
        axios.post("/candidate/partylists/create", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    // Apply to join a partylist
    apply: (partylistId: number) =>
        axios.post(`/candidate/partylists/${partylistId}/apply`),

    // Get pending requests for my partylist
    getRequests: () => axios.get("/candidate/partylists/requests"),

    // Handle a request (approve/reject)
    handleRequest: (membershipId: number, action: "approve" | "reject") =>
        axios.put(`/candidate/partylists/requests/${membershipId}`, { action }),

    // Get my partylist membership
    getMyPartylist: (electionId: number) =>
        axios.get(`/candidate/partylists/my/${electionId}`),
};
