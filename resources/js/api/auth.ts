import axios from "./axios";
import {
    ApiResponse,
    User,
    PasswordChangeData,
    ForgotPasswordData,
    ResetPasswordData,
} from "../types";

export interface LoginResponse {
    success: boolean;
    message?: string;
    token: string;
    user: User;
    role?: string;
}

export const authAPI = {
    login: (
        email: string,
        password: string,
    ): Promise<{ data: LoginResponse }> =>
        axios.post("/login", { email, password }),

    logout: (): Promise<{ data: { success: boolean } }> =>
        axios.post("/logout"),

    getMe: (): Promise<{ data: User }> => axios.get("/me"),

    updateFacePhoto: (
        formData: FormData,
    ): Promise<ApiResponse<{ face_photo_url: string }>> =>
        axios.post("/update-face-photo", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    changePassword: (
        passwordData: PasswordChangeData,
    ): Promise<ApiResponse<void>> =>
        axios.post("/change-password", passwordData),

    forgotPassword: (
        data: ForgotPasswordData,
    ): Promise<ApiResponse<{ message: string }>> =>
        axios.post("/forgot-password", data),

    resetPassword: (
        data: ResetPasswordData,
    ): Promise<ApiResponse<{ message: string }>> =>
        axios.post("/reset-password", data),

    detectFace: (
        formData: FormData,
    ): Promise<
        ApiResponse<{
            success: boolean;
            face_detected: boolean;
            accepted: boolean;
            message: string;
            face_quality?: number;
        }>
    > =>
        axios.post("/detect-face", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
};
