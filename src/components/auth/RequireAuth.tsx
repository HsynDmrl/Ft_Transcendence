import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/user/UserContext";

interface RequireAuthProps {
    children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
    const { user } = useUser();
    const location = useLocation();

    let messageKey = "auth_required";
    if (location.pathname === "/play") {
        messageKey = "auth_required_play";
    } else if (location.pathname === "/leaderboard") {
        messageKey = "auth_required_leaderboard";
    } else if (location.pathname === "/profile") {
        messageKey = "auth_required_profile";
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                state={{ from: location, messageKey }}
                replace
            />
        );
    }

    return <>{children}</>;
}
