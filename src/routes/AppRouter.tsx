import { Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import ProfilePage from "../pages/ProfilePage";
import Play from "../pages/Play";
import Leaderboard from "../pages/Leaderboard";
import RequireAuth from "../components/auth/RequireAuth";
import RegisterPage from "../pages/RegisterPage";
import FriendsPage from "../pages/FriendsPage";
import ChatPage from "../pages/ChatPage";

export default function AppRouter() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Home />} />

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
                <Route
                    path="/friends"
                    element={
                        <RequireAuth>
                            <FriendsPage />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <RequireAuth>
                            <ProfilePage />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/chat"
                    element={
                        <RequireAuth>
                            <ChatPage />
                        </RequireAuth>
                    }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<RegisterPage />} />
            </Routes>
        </Layout>
    );
}
