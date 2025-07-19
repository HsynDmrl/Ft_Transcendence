// Kullanıcı temel modeli (listeleme, detay, vs.)
export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    displayName: string;
    avatar?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Detay görünüm modeli artık User ile aynı (şimdilik)
export type UserDetail = User;

// Yeni kullanıcı oluşturma isteği
export interface CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    displayName: string;
}

// Oluşturma cevabı
export interface CreateUserResponseDto {
    message: string;
    statusCode: number;
    data: User;
}

// Güncelleme isteği (profile/update için id gerekmez)
export interface UpdateUserDto {
    displayName?: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
}

// Güncelleme cevabı
export interface UpdateUserResponseDto {
    message: string;
    statusCode: number;
    data: User;
}
