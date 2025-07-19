import type { BaseModel } from "../../models/BaseModel";

export interface User extends BaseModel {
    firstName: string;
    lastName: string;
    email: string;
    displayName: string;
    avatar?: string;
    isActive: boolean;
}

export interface LoginPayload {
    email: string;
    password: string;
}
