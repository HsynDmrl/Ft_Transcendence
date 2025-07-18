import { createContext, useContext, useState, type ReactNode } from "react";
import en from "../../locales/en.json";
import tr from "../../locales/tr.json";
import de from "../../locales/de.json";

type Language = "en" | "tr" | "de";
type TranslationObject = Record<string, string>;
const translations: Record<Language, TranslationObject> = { en, tr, de };

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
    return context;
}
