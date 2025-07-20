export type Language = "en" | "tr" | "de";

export interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    lang: Language;
}
