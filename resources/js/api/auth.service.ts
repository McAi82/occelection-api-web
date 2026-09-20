// src/api/auth.service.ts
import axios from "./axios";
import { User, ApiResponse, PasswordChangeData } from "../types";

export const authService = {
  updateProfile: (data: Partial<User>): Promise<ApiResponse<{ user: User }>> =>
    axios.put("/profile", data),

  changePassword: (data: PasswordChangeData): Promise<ApiResponse<void>> =>
    axios.post("/change-password", data),

  updateFacePhoto: (formData: FormData): Promise<ApiResponse<{ face_photo_url: string }>> =>
    axios.post("/update-face-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};