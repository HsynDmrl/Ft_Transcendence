import axiosInstance from "../core/utils/interceptors/axiosInterceptors";
import type {
    UpdateUserDto,
    UpdateUserResponseDto,
    User,
    UserDetail
} from "../models/UserModels";

class UserService {
    // Get all users
    async getUsers(): Promise<User[]> {
        const res = await axiosInstance.get("/users");
        return res.data;
    }

    // Get profile (requires auth)
    async getProfile(): Promise<UserDetail> {
        const res = await axiosInstance.get("/profile");
        return res.data;
    }

    // Update profile (requires auth)
    async updateProfile(data: UpdateUserDto): Promise<UpdateUserResponseDto> {
        const res = await axiosInstance.post("/profile/update", data);
        return res.data;
    }

    // Şifre değiştirme (requires auth)
    async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string; statusCode: number }> {
        const res = await axiosInstance.post("/auth/change-password", {
            oldPassword,
            newPassword,
        });
        return res.data;
    }
}

export const userService = new UserService();
