// resources/js/api/candidacy.ts
import axios from "./axios";

export interface CandidacyFormData {
    lastName: string;
    firstName: string;
    mi: string;
    age: string;
    course: string;
    presentAddress: string;
    presentAddress2: string;
    studentNo: string;
    currentYear: string;
    noUnitLoad: string;
    cellphone: string;
    socialMedia: string;
    positionCSG: boolean;
    positionSC: boolean;
    department: string;
    partyIndependent: boolean;
    partyOther: boolean;
    politicalParty: string;
    aff1Org: string;
    aff1Pos: string;
    aff1Date: string;
    aff2Org: string;
    aff2Pos: string;
    aff2Date: string;
    aff3Org: string;
    aff3Pos: string;
    aff3Date: string;
    day: string;
    month: string;
    year: string;
    platform?: string;
    qualifications?: string;
    selected_partylist_id?: number | null;
}

export interface CandidacyApplication {
    application_id: number;
    user_id: number;
    election_id: number;
    form_data: CandidacyFormData;
    admin_status: "pending" | "approved" | "rejected";
    admin_approved_at: string | null;
    admin_approved_by_user_id: number | null;
    recommendation_letter_path: string | null;
    letter_generated: boolean;
    admin_remarks: string | null;
    created_at: string;
    updated_at: string;
    user?: {
        user_id: number;
        first_name: string;
        last_name: string;
        email: string;
        student_id: string;
    };
    election?: {
        election_id: number;
        title: string;
    };
}

export interface PartylistData {
    partylist_id: number;
    name: string;
    description?: string;
    logo_url?: string;
    election_id: number;
    member_count: number;
    creator?: {
        user_id: number;
        first_name: string;
        last_name: string;
    };
}

export interface AvailableElection {
    election_id: number;
    title: string;
    election_type: string;
    description?: string;
    voting_start: string;
    voting_end: string;
    course?: {
        course_id: number;
        course_code: string;
        course_name: string;
    };
    is_available: boolean;
}

export interface AppliedElection {
    election_id: number;
    election_title: string;
    status: "pending" | "approved" | "rejected";
    application_id: number;
    submitted_at: string;
}

export interface CandidateElection {
    election_id: number;
    election_title: string;
    position: string;
    status: "approved" | "pending";
    candidate_id: number;
}

export interface AvailableElectionsResponse {
    available: AvailableElection[];
    applied: AppliedElection[];
    candidate: CandidateElection[];
    can_apply: boolean;
    has_pending_application: boolean;
}

export const candidacyAPI = {
    apply: (
        electionId: number,
        formData: CandidacyFormData,
    ): Promise<{ data: CandidacyApplication }> =>
        axios.post("/candidacy/apply", {
            election_id: electionId,
            form_data: formData,
            selected_partylist_id: formData.selected_partylist_id,
        }),

    getMyApplications: (
        electionId?: number,
    ): Promise<{ data: CandidacyApplication[] }> =>
        axios.get(
            `/candidacy/my-applications${electionId ? "/" + electionId : ""}`,
        ),

    downloadMyRecommendationLetter: async (
        applicationId: number,
    ): Promise<Blob> => {
        try {
            const response = await axios.get(
                `/candidacy/my-applications/${applicationId}/download-letter`,
                {
                    responseType: "blob",
                },
            );

            // ✅ Check if response is a Blob
            if (response.data instanceof Blob) {
                return response.data;
            }

            // ✅ If response is not a Blob, try to convert it
            if (response.data && typeof response.data === "object") {
                // Check if it's a JSON error response
                if (response.data.message) {
                    throw new Error(response.data.message);
                }
            }

            throw new Error("Invalid response format");
        } catch (error: any) {
            console.error("Download error:", error);

            // ✅ Try to extract error message from response
            if (error.response && error.response.data) {
                if (error.response.data instanceof Blob) {
                    // Try to read the blob as text
                    const text = await error.response.data.text();
                    try {
                        const json = JSON.parse(text);
                        if (json.message) {
                            throw new Error(json.message);
                        }
                    } catch (e) {
                        // If not JSON, it might be HTML error page
                        throw new Error(
                            "Failed to download letter. Please try again.",
                        );
                    }
                }
            }

            throw error;
        }
    },

    adminGetApplications: (params?: {
        status?: string;
        election_id?: number;
        page?: number;
        per_page?: number;
    }): Promise<{ data: any }> =>
        axios.get("/admin/candidacy/applications", { params }),

    adminApprove: (
        id: number,
        remarks?: string,
    ): Promise<{ data: CandidacyApplication }> =>
        axios.put(`/admin/candidacy/${id}/approve`, { remarks }),

    adminReject: (
        id: number,
        remarks?: string,
    ): Promise<{ data: CandidacyApplication }> =>
        axios.put(`/admin/candidacy/${id}/reject`, { remarks }),

    downloadRecommendationLetter: async (id: number): Promise<Blob> => {
        try {
            const response = await axios.get(
                `/admin/candidacy/${id}/recommendation-letter`,
                {
                    responseType: "blob",
                },
            );

            if (response.data instanceof Blob) {
                return response.data;
            }

            throw new Error("Invalid response format");
        } catch (error: any) {
            console.error("Download error:", error);
            if (error.response && error.response.data) {
                if (error.response.data instanceof Blob) {
                    const text = await error.response.data.text();
                    try {
                        const json = JSON.parse(text);
                        if (json.message) {
                            throw new Error(json.message);
                        }
                    } catch (e) {
                        throw new Error(
                            "Failed to download letter. Please try again.",
                        );
                    }
                }
            }
            throw error;
        }
    },

    getAvailableElections: (): Promise<{ data: AvailableElectionsResponse }> =>
        axios.get("/candidacy/available-elections"),

    getCurrentYearPartylists: (
        electionId: number,
    ): Promise<{ data: PartylistData[] }> => axios.get(`/partylists`),

    getAvailablePartylists: (electionId: number) =>
        axios.get(`/candidacy/available-partylists/${electionId}`),

    applyToPartylist: (partylistId: number) =>
        axios.post(`/candidacy/apply-partylist/${partylistId}`),

    getMyPartylist: (electionId: number) =>
        axios.get(`/candidacy/my-partylist/${electionId}`),

    getPartylistRequests: () => axios.get("/candidacy/partylist-requests"),

    handlePartylistRequest: (
        membershipId: number,
        action: "approve" | "reject",
    ) => axios.put(`/candidacy/partylist-requests/${membershipId}`, { action }),
};
