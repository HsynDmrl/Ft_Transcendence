import { useState } from "react";
import InputField from "../components/form/InputField";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useUser } from "../context/user/UserContext";

export default function Login() {
    const { login } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const message = location.state?.message;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError("Lütfen tüm alanları doldurun.");
            return;
        }

        if (email === "test@test.com" && password === "123") {
            login({
                id: 1,
                firstName: "Ahmet",
                lastName: "Yılmaz",
                email,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isRemoved: false,
            });
            navigate("/");
        } else {
            setError("Email veya parola yanlış. Kayıt olmak için aşağıdaki linke tıklayın.");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-24 p-6 bg-white rounded-md shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Giriş Yap</h2>

            {/* 💬 Auth'dan gelen uyarı mesajı */}
            {message && (
                <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded text-center">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <InputField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error && !email ? error : undefined}
                    placeholder="test@test.com"
                />
                <InputField
                    label="Parola"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={error && !password ? error : undefined}
                    placeholder="123"
                />


                {error && !(!email || !password) && (
                    <>
                        <p className="text-red-500 mb-2 text-center">{error}</p>
                        <div className="text-center">
                            <Link
                                to="/register"
                                className="text-blue-600 hover:underline font-semibold"
                            >
                                Kayıt Ol
                            </Link>
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold mt-4"
                >
                    Giriş Yap
                </button>
            </form>
        </div>
    );
}
