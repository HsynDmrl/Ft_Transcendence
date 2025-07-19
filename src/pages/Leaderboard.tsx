import { useState, useEffect } from "react";
import { useLanguage } from "../context/language/LanguageProvider";

interface LeaderboardEntry {
    id: number;
    username: string;
    score: number;
}

export default function Leaderboard() {
    const { t } = useLanguage();
    const [data, setData] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        // Fake veri simülasyonu
        const fakeData: LeaderboardEntry[] = [
            { id: 1, username: "PlayerOne", score: 1500 },
            { id: 2, username: "PingMaster", score: 1400 },
            { id: 3, username: "AcePaddle", score: 1300 },
            { id: 4, username: "SpinKing", score: 1200 },
            { id: 5, username: "NetNinja", score: 1100 },
        ];

        // Simulate API delay
        setTimeout(() => setData(fakeData), 500);
    }, []);

    return (
        <div className="max-w-4xl mx-auto mt-24 p-6 bg-white rounded shadow">
            <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
                {t("leaderboard_title")}
            </h1>
            {data.length === 0 ? (
                <p className="text-center text-gray-500">{t("leaderboard_loading")}</p>
            ) : (
                <table className="w-full table-auto border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-blue-100">
                            <th className="border border-gray-300 px-4 py-2">{t("navbar_home")}</th>
                            <th className="border border-gray-300 px-4 py-2">{t("navbar_profile")}</th>
                            <th className="border border-gray-300 px-4 py-2">{t("navbar_play")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(({ id, username, score }, index) => (
                            <tr key={id} className="text-center hover:bg-blue-50">
                                <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                                <td className="border border-gray-300 px-4 py-2 font-semibold">{username}</td>
                                <td className="border border-gray-300 px-4 py-2">{score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

