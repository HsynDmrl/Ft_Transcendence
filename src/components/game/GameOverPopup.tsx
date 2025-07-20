import { useLanguage } from "../../context/language/LanguageContext";

function GameOverPopup({ winner, onRestart }: { winner: string; onRestart: () => void }) {
    const { t } = useLanguage();
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center shadow-lg">
                <h2 className="text-2xl font-bold mb-4">{t(winner)}</h2>
                <button
                    onClick={onRestart}
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
                >
                    {t("game_restart")}
                </button>
            </div>
        </div>
    );
}

export default GameOverPopup;