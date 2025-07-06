import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../components/form/InputField";
import { authService, type RegisterDto } from "../services/authService";

export default function Register() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Form validation
            if (!firstName || !lastName || !email || !password || !confirmPassword || !displayName) {
                setError("Lütfen tüm alanları doldurun.");
                return;
            }

            if (password !== confirmPassword) {
                setError("Parolalar eşleşmiyor.");
                return;
            }

            if (password.length < 6) {
                setError("Parola en az 6 karakter olmalıdır.");
                return;
            }

            // Prepare registration data
            const registerData: RegisterDto = {
                firstName,
                lastName,
                email,
                password,
                displayName
            };

            // Call backend API
            const response = await authService.register(registerData);

            if (response.data.success && response.data.data) {
                // Handle successful registration
                authService.handleAuthSuccess(response.data.data);
                alert("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz.");
                navigate("/login");
            } else {
                // Handle API error response
                setError(response.data.error || response.data.message || "Kayıt işlemi başarısız oldu.");
            }

        } catch (error: any) {
            console.error("Registration error:", error);
            
            // Handle different types of errors
            if (error.response?.data?.error) {
                setError(error.response.data.error);
            } else if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError("Bir hata oluştu. Lütfen tekrar deneyin.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-24 p-6 bg-white rounded-md shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Kayıt Ol</h2>
            <form onSubmit={handleSubmit}>
                <InputField
                    label="Ad"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                />
                <InputField
                    label="Soyad"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                />
                <InputField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <InputField
                    label="Kullanıcı Adı"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
                <InputField
                    label="Parola"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <InputField
                    label="Parola (Tekrar)"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-semibold"
                >
                    {isLoading ? "Kayıt Ediliyor..." : "Kayıt Ol"}
                </button>
            </form>
        </div>
    );
}
