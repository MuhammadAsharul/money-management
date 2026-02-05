'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('id');

    useEffect(() => {
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && (savedLang === 'id' || savedLang === 'en')) {
            setLanguage(savedLang);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const t = (path: string, params?: Record<string, string | number>): string => {
        const keys = path.split('.');
        let value: any = translations[language];

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key as keyof typeof value];
            } else {
                return path; // Fallback to key if not found
            }
        }

        if (typeof value === 'string' && params) {
            return Object.entries(params).reduce((acc, [key, val]) => {
                return acc.replace(new RegExp(`{${key}}`, 'g'), String(val));
            }, value);
        }

        return typeof value === 'string' ? value : path;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
