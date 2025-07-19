import { useState } from "react";
import InputField from "../components/form/InputField";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useUser } from "../context/user/UserContext";
import { authService } from "../services/authService";
import tokenService from "../services/tokenService";
import { useLanguage } from "../context/language/LanguageProvider";

export default function Login() {
    const { t } = useLanguage();
    const { login } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const messageKey = location.state?.messageKey;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError(t("login_fail"));
            return;
        }

        try {
            const result = await authService.login({ email, password });
            tokenService.setToken(result.accessToken);
            login(result.user);
            setError(null);
            navigate("/", { state: { message: t("login_success") } });
        } catch (err: any) {
            setError(err?.response?.data?.error || t("login_fail"));
        }
    };

    return (
        <div className="max-w-md mx-auto mt-24 p-6 bg-white rounded-md shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">{t("login_title")}</h2>
            {messageKey && (
                <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded text-center">
                    {t(messageKey)}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                {error && (
                    <p className="text-red-500 mb-2 text-center">{error}</p>
                )}
                <InputField
                    label={t("login_email")}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error && !email ? error : undefined}
                    placeholder={t("login_email")}
                />
                <InputField
                    label={t("login_password")}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={error && !password ? error : undefined}
                    placeholder={t("login_password")}
                />
                <div className="text-center mt-2">
                    <Link
                        to="/register"
                        className="text-blue-600 hover:underline font-semibold"
                    >
                        {t("navbar_register")}
                    </Link>
                </div>
                <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold mt-4"
                >
                    {t("navbar_login")}
                </button>
            </form>
        </div>
    );
}