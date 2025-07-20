import { useState, type ReactNode } from "react";
import { LanguageContext } from "./LanguageContext";
import type { Language, LanguageContextType } from "./languageTypes";
import en from "../../locales/en.json";
import tr from "../../locales/tr.json";
import de from "../../locales/de.json";

type TranslationObject = Record<string, string>;
const translations: Record<Language, TranslationObject> = { en, tr, de };

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    const value: LanguageContextType = {
        language,
        setLanguage,
        t,
        lang: language,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}