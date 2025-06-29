import type { BaseModel } from "./BaseModel";

// Kullanıcı temel modeli (listeleme, detay, vs.)
export interface User extends BaseModel {
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
}

// Detay görünüm modeli artık User ile aynı (şimdilik)
export type UserDetail = User;

// Yeni kullanıcı oluşturma isteği
export interface CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

// Oluşturma cevabı
export interface CreateUserResponseDto extends User { }

// Güncelleme isteği
export interface UpdateUserDto {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    isActive?: boolean;
}

// Güncelleme cevabı
export interface UpdateUserResponseDto extends User { }
