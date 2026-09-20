// resources/js/api/campaignScheduleRequest.ts
import axios from "./axios";
import { useAuth } from "../contexts/AuthContext";

export interface ScheduleRequestData {
    election_id: number;
    section_id: number;
    preferred_date: string;
    preferred_start_time: string;
    preferred_end_time: string;
    message?: string;
}

export interface ProcessRequestData {
    action: "approve" | "reject" | "reschedule";
    admin_remarks?: string;
    new_date?: string;
    new_start_time?: string;
    new_end_time?: string;
}

export interface Section {
    section_id: number;
    section_code: string;
    section_name: string;
    year_level: number;
    course?: {
        course_id: number;
        course_code: string;
        course_name: string;
    };
    display_name: string;
}

// ✅ Get the base path based on user role
const getBasePath = (role?: string): string => {
    if (role === "admin") return "/admin";
    if (role === "comelec") return "/comelec";
    return "/admin"; // Default to admin
};

export const campaignScheduleRequestAPI = {
    // Candidate endpoints
    getAvailableSections: async (electionId: number): Promise<Section[]> => {
        try {
            const response = await axios.get(
                `/candidate/schedule-requests/sections/${electionId}`,
            );

            let sections = [];
            if (response.data?.data) {
                sections = response.data.data;
            } else if (Array.isArray(response.data)) {
                sections = response.data;
            } else if (response.data?.success && response.data?.data) {
                sections = response.data.data;
            }

            return sections;
        } catch (error) {
            console.error("Failed to fetch sections:", error);
            throw error;
        }
    },

    create: (data: ScheduleRequestData) =>
        axios.post("/candidate/schedule-requests", data),

    getMyRequests: async () => {
        try {
            const response = await axios.get("/candidate/schedule-requests/my");

            let requests = [];
            if (response.data?.data) {
                requests = response.data.data;
            } else if (Array.isArray(response.data)) {
                requests = response.data;
            } else if (response.data?.success && response.data?.data) {
                requests = response.data.data;
            }

            return requests;
        } catch (error) {
            console.error("Failed to fetch my requests:", error);
            throw error;
        }
    },

    delete: (requestId: number) =>
        axios.delete(`/candidate/schedule-requests/${requestId}`),

    // ✅ Admin/COMELEC endpoints - dynamically choose the right path
    getRequests: async (params?: Record<string, unknown>, role?: string) => {
        const basePath = getBasePath(role);
        const response = await axios.get(`${basePath}/schedule-requests`, {
            params,
        });

        let requests = [];
        if (response.data?.data) {
            if (Array.isArray(response.data.data)) {
                requests = response.data.data;
            } else if (response.data.data.data) {
                requests = response.data.data.data;
            }
        }

        return requests;
    },

    processRequest: (
        requestId: number,
        data: ProcessRequestData,
        role?: string,
    ) => {
        const basePath = getBasePath(role);
        return axios.put(
            `${basePath}/schedule-requests/${requestId}/process`,
            data,
        );
    },

    getStats: async (electionId?: number, role?: string) => {
        const basePath = getBasePath(role);
        const response = await axios.get(
            `${basePath}/schedule-requests/stats`,
            {
                params: { election_id: electionId },
            },
        );
        return response.data;
    },
};
