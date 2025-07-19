import { useLanguage } from "../context/language/LanguageProvider";

export default function Home() {
    const { t } = useLanguage();
    return (
        <div className="text-center mt-12">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">{t("home_title")}</h1>
            <p className="text-lg text-gray-700">
                {t("home_desc")}
            </p>
        </div>
    );
}
