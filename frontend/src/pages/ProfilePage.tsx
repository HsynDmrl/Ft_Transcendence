import { useState, type ChangeEvent, type FormEvent } from "react";
import { useUser } from "../context/user/UserContext";

export default function ProfilePage() {
    const { user, updateUser } = useUser();

    // Form state
    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [email, setEmail] = useState(user?.email || "");
    const [isActive, setIsActive] = useState(user?.isActive || false);

    // Profil resmi için state
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

    // Hata ve başarı mesajları
    const [message, setMessage] = useState<string | null>(null);

    // Profil resmi seçildiğinde preview için
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImageFile(file);

            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result) setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Basit validasyon
        if (!firstName || !lastName || !email) {
            setMessage("Lütfen tüm zorunlu alanları doldurun.");
            return;
        }
        // Profil resmi geçici olarak localde kullanıldığı için sembolik kullanım
        if (profileImageFile) {
            console.log("Seçilen profil resmi:", profileImageFile.name);
        }
        // TODO: API çağrısı yapılacak burada, örnek olarak güncelleme simülasyonu:
        updateUser({
            ...user!,
            firstName,
            lastName,
            email,
            isActive,
            // Profil resmi backend'de ayrı işlem olabilir,
            // burada sadece local state'i güncelliyoruz.
        });

        setMessage("Profil başarıyla güncellendi!");
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-md shadow-md mt-24">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Profilim</h1>
            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="flex flex-col items-center">
                    {profileImage ? (
                        <img
                            src={profileImage}
                            alt="Profil Fotoğrafı"
                            className="w-32 h-32 rounded-full object-cover mb-4"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center mb-4 text-gray-600 text-xl">
                            Fotoğraf Yok
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block text-sm text-gray-600"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-semibold" htmlFor="firstName">
                        Ad
                    </label>
                    <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1 font-semibold" htmlFor="lastName">
                        Soyad
                    </label>
                    <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1 font-semibold" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div className="flex items-center space-x-3">
                    <input
                        id="isActive"
                        type="checkbox"
                        checked={isActive}
                        onChange={() => setIsActive(!isActive)}
                        className="w-5 h-5"
                    />
                    <label htmlFor="isActive" className="font-semibold">
                        Aktif Kullanıcı
                    </label>
                </div>

                {message && (
                    <p className="text-center text-green-600 font-semibold">{message}</p>
                )}

                <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
                >
                    Profili Güncelle
                </button>
            </form>
        </div>
    );
}
