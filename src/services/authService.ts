import axiosInstance from "../core/utils/interceptors/axiosInterceptors";
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "../models/AuthModels";

class AuthService {
  // Kayıt
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const res = await axiosInstance.post("/auth/register", data);
    return res.data;
  }

  // Giriş
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await axiosInstance.post("/auth/login", data);
    return res.data;
  }

  // Şifre güncelle
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const res = await axiosInstance.post("/auth/change-password", data);
    return res.data;
  }

  // Refresh token
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const res = await axiosInstance.post("/auth/refresh-token", data);
    return res.data;
  }
}

export const authService = new AuthService();