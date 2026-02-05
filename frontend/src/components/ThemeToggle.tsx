'use client';

import { useTheme } from '@/lib/theme-context';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="w-12 h-12 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <Moon size={20} className="text-slate-600 dark:text-slate-300" />
            ) : (
                <Sun size={20} className="text-yellow-500" />
            )}
        </button>
    );
}
