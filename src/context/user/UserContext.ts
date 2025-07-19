import { createContext, useContext } from "react";
import type { User } from "./userTypes";

interface UserContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    updateUser: (updatedUser: User) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
}
