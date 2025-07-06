import type { AxiosResponse } from "axios";
import axiosInstance from "../core/utils/interceptors/axiosInterceptors";
import tokenService from "./tokenService";

// Types for authentication
export interface RegisterDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    displayName: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
    isActive: boolean;
    isOnline: boolean;
    lastSeen?: string;
    wins: number;
    losses: number;
    createdAt: string;
    updatedAt: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    user: User;
    tokens: TokenPair;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export class AuthService {
    
    // User Registration
    async register(data: RegisterDto): Promise<AxiosResponse<ApiResponse<AuthResponse>>> {
        return axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
    }

    // User Login
    async login(data: LoginDto): Promise<AxiosResponse<ApiResponse<AuthResponse>>> {
        return axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/login', data);
    }

    // User Logout
    async logout(): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
        return axiosInstance.post<ApiResponse<{ message: string }>>('/api/auth/logout');
    }

    // Refresh Token
    async refreshToken(refreshToken: string): Promise<AxiosResponse<ApiResponse<TokenPair>>> {
        return axiosInstance.post<ApiResponse<TokenPair>>('/api/auth/refresh', { 
            refreshToken 
        });
    }

    // Get Current User
    async getMe(): Promise<AxiosResponse<ApiResponse<User>>> {
        return axiosInstance.get<ApiResponse<User>>('/api/auth/me');
    }

    // Helper methods for handling authentication state
    handleAuthSuccess(authResponse: AuthResponse): void {
        // Store tokens
        tokenService.setAllTokens(
            authResponse.tokens.accessToken, 
            authResponse.tokens.refreshToken
        );
    }

    handleAuthLogout(): void {
        // Remove tokens
        tokenService.removeToken();
    }

    isAuthenticated(): boolean {
        return tokenService.hasToken();
    }
}

export const authService = new AuthService(); 