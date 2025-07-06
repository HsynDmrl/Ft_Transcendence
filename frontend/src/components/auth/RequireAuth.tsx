import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/user/UserContext";

interface RequireAuthProps {
    children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
    const { user } = useUser();
    const location = useLocation();

    if (!user) {
        let message = "Lütfen giriş yapmalısınız.";

        if (location.pathname === "/play") {
            message = "Oynamak için giriş yapmalısınız.";
        } else if (location.pathname === "/leaderboard") {
            message = "Skor tablosunu görmek için giriş yapmalısınız.";
        } else if (location.pathname === "/profile") {
            message = "Profil bilgilerinizi görüntülemek için giriş yapmalısınız.";
        }

        return (
            <Navigate
                to="/login"
                state={{ from: location, message }}
                replace
            />
        );
    }

    return <>{children}</>;
}
