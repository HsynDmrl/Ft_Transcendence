import { useState, type ReactNode } from "react";
import { UserContext } from "./UserContext";
import type { User } from "./userTypes";

interface Props {
    children: ReactNode;
}

export function UserProvider({ children }: Props) {
    const [user, setUser] = useState<User | null>(null);

    const login = (userData: User) => setUser(userData);
    const logout = () => setUser(null);
    const updateUser = (updatedUser: User) => setUser(updatedUser);

    return (
        <UserContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}
