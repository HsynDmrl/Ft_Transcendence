import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../components/form/InputField";

export default function Register() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basit validasyon
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            setError("Lütfen tüm alanları doldurun.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Parolalar eşleşmiyor.");
            return;
        }

        // TODO: Burada API çağrısı yapılacak
        // Şimdilik kayıt başarılı simülasyonu:
        alert("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz.");
        navigate("/login");
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
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
                >
                    Kayıt Ol
                </button>
            </form>
        </div>
    );
}
