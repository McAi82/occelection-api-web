// resources/js/api/face.ts
import axios from "./axios";
import { ApiResponse, User } from "../types";

export interface FaceDetectionResult {
    success: boolean;
    face_detected: boolean;
    accepted: boolean;
    message: string;
    face_quality?: number;
}

export const faceAPI = {
    // ✅ FIXED: Get users without face with proper response handling
    getUsersWithoutFace: async (): Promise<{ data: { users: User[] } }> => {
        try {
            const response = await axios.get("/admin/face/users-without");
            // Handle different response structures
            if (response.data?.data?.users) {
                return { data: { users: response.data.data.users } };
            }
            if (response.data?.users) {
                return { data: { users: response.data.users } };
            }
            if (Array.isArray(response.data)) {
                return { data: { users: response.data } };
            }
            return { data: { users: [] } };
        } catch (error) {
            console.error("Failed to fetch users without face:", error);
            return { data: { users: [] } };
        }
    },

    // ✅ FIXED: Get users with face with proper response handling
    getUsersWithFace: async (): Promise<{ data: { users: User[] } }> => {
        try {
            const response = await axios.get("/admin/face/users-with");
            if (response.data?.data?.users) {
                return { data: { users: response.data.data.users } };
            }
            if (response.data?.users) {
                return { data: { users: response.data.users } };
            }
            if (Array.isArray(response.data)) {
                return { data: { users: response.data } };
            }
            return { data: { users: [] } };
        } catch (error) {
            console.error("Failed to fetch users with face:", error);
            return { data: { users: [] } };
        }
    },

    registerFace: (
        formData: FormData,
    ): Promise<ApiResponse<{ face_photo_url: string }>> =>
        axios.post("/admin/face/register", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    deleteFace: (userId: number): Promise<ApiResponse<void>> =>
        axios.delete(`/admin/face/delete/${userId}`),

    verifyFace: (
        userId: number,
        facePhoto: File,
    ): Promise<ApiResponse<{ verified: boolean; confidence: number }>> => {
        const formData = new FormData();
        formData.append("user_id", userId.toString());
        formData.append("face_photo", facePhoto);
        return axios.post("/face/verify", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};
