'use client';

import { useLanguage } from '@/lib/language-context';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Languages } from 'lucide-react';

export default function FloatingControls() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            {/* Language Toggle */}
            <button
                onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-110 transition-transform"
                title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            >
                <span className="font-bold text-xs">{language === 'id' ? 'ID' : 'EN'}</span>
            </button>

            {/* Theme Toggle Wrapper to match style */}
            <div className="bg-white dark:bg-slate-800 rounded-full shadow-lg border border-gray-200 dark:border-slate-700 hover:scale-110 transition-transform">
                <ThemeToggle />
            </div>
        </div>
    );
}
