import { Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProfilePage from "../pages/ProfilePage";
import Play from "../pages/Play";
import Leaderboard from "../pages/Leaderboard";
import RequireAuth from "../components/auth/RequireAuth";

export default function AppRouter() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Home />} />

                {/* Giriş yapılmışsa erişilecek sayfalar */}
                <Route path="/play"
                    element={
                        <RequireAuth>
                            <Play />
                        </RequireAuth>}
                />
                <Route
                    path="/leaderboard"
                    element={
                        <RequireAuth>
                            <Leaderboard />
                        </RequireAuth>
                    }
                />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Routes>
        </Layout>
    );
}
