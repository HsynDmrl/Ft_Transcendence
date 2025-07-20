import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useUser } from "../context/user/UserContext";
import { userService } from "../services/userService";
import { useLanguage } from "../context/language/LanguageContext";

export default function ProfilePage() {
    const { t } = useLanguage();
    const { user, updateUser } = useUser();

    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [avatar, setAvatar] = useState(user?.avatar || "");

    const [profileImage, setProfileImage] = useState<string | null>(user?.avatar || null);
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

    const [message, setMessage] = useState<string | null>(null);

    async function fetchProfileAndUpdateStates() {
        try {
            const res = await userService.getProfile();
            console.log("fetchProfileAndUpdateStates - backend'den gelen veri:", res);
            updateUser(res);
            setDisplayName(res.displayName ?? "");
            setFirstName(res.firstName ?? "");
            setLastName(res.lastName ?? "");
            setAvatar(res.avatar ?? "");
            setProfileImage(res.avatar ?? null);
        } catch (err) {
        }
    }

    useEffect(() => {
        fetchProfileAndUpdateStates();
    }, []);

    useEffect(() => {
        setDisplayName(user?.displayName ?? "");
        setFirstName(user?.firstName ?? "");
        setLastName(user?.lastName ?? "");
        setAvatar(user?.avatar ?? "");
        setProfileImage(user?.avatar ?? null);
    }, [user]);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImageFile(file);

            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result) {
                    setProfileImage(reader.result as string);
                    setAvatar(reader.result as string); 
                }
            };
            reader.readAsDataURL(file);

            e.target.value = "";
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const updateRes = await userService.updateProfile({
                displayName,
                avatar,
                firstName,
                lastName,
            });
            console.log("Profil güncelleme sonucu:", updateRes);
            if (updateRes.message === "Profil güncellendi") {
                const profileRes = await userService.getProfile();
                updateUser(profileRes);
                setMessage(t("profile_update_success"));
                setProfileImageFile(null);
            } else {
                setMessage(updateRes.message || t("profile_update_fail"));
            }
        } catch (err: any) {
            setMessage(err?.response?.data?.message || t("profile_update_fail"));
        }
    };

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<boolean | null>(null);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);
        setPasswordSuccess(null);

        if (!oldPassword || !newPassword) {
            setPasswordMessage(t("change_password_fail"));
            setPasswordSuccess(false);
            return;
        }
        setPasswordLoading(true);
        try {
            const res = await userService.changePassword(oldPassword, newPassword);
            console.log("Şifre değiştirme sonucu:", res);
            if (res.message === "Şifre başarıyla değiştirildi") {
                setPasswordMessage(t("change_password_success"));
                setPasswordSuccess(true);
                setOldPassword("");
                setNewPassword("");
            }
        } catch (err: any) {
            if (err?.response?.status === 400) {
                setPasswordMessage(t("change_password_old_error"));
            }
            else {
                setPasswordMessage(t("change_password_fail"));
            }
            setPasswordSuccess(false);
        }
        setPasswordLoading(false);
    };

    useEffect(() => {
        const btn = document.getElementById("profile-update-btn");
        if (btn) {
            btn.addEventListener("click", () => {
                console.log("Update button clicked");
            });
        }
        return () => {
            if (btn) {
                btn.removeEventListener("click", () => {});
            }
        };
    }, []);

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-md shadow-md mt-24">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">{t("profile_title")}</h1>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Kullanıcı Bilgileri Kartı */}
                <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow p-6 flex flex-col items-center">
                    {user?.avatar && user.avatar !== "" ? (
                        <img
                            src={user.avatar}
                            alt={t("register_avatar")}
                            className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-blue-300 shadow"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center mb-4 text-gray-600 text-xl border-4 border-blue-200 shadow">
                            {t("register_avatar")}
                        </div>
                    )}
                    <div className="w-full flex flex-col gap-4 mt-2">
                        <div>
                            <label className="block mb-1 font-semibold text-blue-700 text-center">
                                {t("register_displayname")}
                            </label>
                            <div className="text-lg text-gray-700 text-center">{user?.displayName}</div>
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-blue-700 text-center">
                                {t("register_firstname")}
                            </label>
                            <div className="text-gray-700 text-center">{user?.firstName}</div>
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-blue-700 text-center">
                                {t("register_lastname")}
                            </label>
                            <div className="text-gray-700 text-center">{user?.lastName}</div>
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-blue-700 text-center">
                                {t("register_email")}
                            </label>
                            <div className="text-gray-700 text-center">{user?.email}</div>
                        </div>
                    </div>
                </div>

                {/* Bilgi Düzenleme Formu */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 space-y-6 bg-white rounded-xl shadow p-6"
                    autoComplete="off"
                >
                    <div>
                        <label className="block mb-1 font-semibold text-blue-600" htmlFor="displayName">
                            {t("register_displayname")}
                        </label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName ?? ""}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-blue-600" htmlFor="firstName">
                            {t("register_firstname")}
                        </label>
                        <input
                            id="firstName"
                            type="text"
                            value={firstName ?? ""}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-blue-600" htmlFor="lastName">
                            {t("register_lastname")}
                        </label>
                        <input
                            id="lastName"
                            type="text"
                            value={lastName ?? ""}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-blue-600" htmlFor="avatar">
                            {t("register_avatar")}
                        </label>
                        <div className="relative">
                            <input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button
                                type="button"
                                className="w-full border border-blue-200 rounded px-3 py-2 text-gray-600 bg-white"
                                onClick={() => document.getElementById("avatar")?.click()}
                            >
                                {t("profile_choose_file")}
                            </button>
                            {profileImageFile && (
                                <span className="block mt-2 text-sm text-gray-700">{profileImageFile.name}</span>
                            )}
                        </div>
                        {/* Avatar preview */}
                        {profileImage && (
                            <div className="mt-4 flex justify-center">
                                <img
                                    src={profileImage}
                                    alt={t("register_avatar")}
                                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-300 shadow"
                                />
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition"
                        id="profile-update-btn"
                    >
                        {t("profile_update_button")}
                    </button>
                    {message && (
                        <p className="text-center text-green-600 font-semibold mt-2">{message}</p>
                    )}
                </form>
            </div>

            {/* Şifre değiştirme formu */}
            <div className="mt-10 p-6 bg-gray-50 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-center text-blue-600">{t("change_password_title")}</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-semibold" htmlFor="oldPassword">
                            {t("change_password_old")}
                        </label>
                        <input
                            id="oldPassword"
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold" htmlFor="newPassword">
                            {t("change_password_new")}
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    {passwordMessage && (
                        <p
                            className={`text-center font-semibold ${
                                passwordSuccess ? "text-green-600" : "text-red-600"
                            }`}
                        >
                            {passwordMessage}
                        </p>
                    )}
                    <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
                        disabled={passwordLoading}
                    >
                        {passwordLoading ? t("change_password_title") : t("change_password_title")}
                    </button>
                </form>
            </div>
        </div>
    );
}