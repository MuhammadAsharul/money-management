'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Wallet,
    Receipt,
    Repeat,
    Menu,
    X,
    MoreHorizontal,
    Target,
    Settings,
    LogOut,
    Tags,
    Trophy,
    FileText,
    Handshake,
    CalendarDays
} from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/ThemeToggle';
import Tooltip from '@/components/ui/Tooltip';

export default function FloatingMenu() {
    const pathname = usePathname();
    const { t, language, setLanguage } = useLanguage();
    const { logout, user } = useAuth();
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const mainNavItems = [
        { href: '/dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
        { href: '/wallets', label: t('sidebar.wallets'), icon: Wallet },
        { href: '/transactions', label: t('sidebar.transactions'), icon: Receipt },
        { href: '/budgets', label: t('sidebar.budgets'), icon: Tags }, // Using Tags icon for Budgets visually distinct
    ];

    const moreNavItems = [
        { href: '/goals', label: t('sidebar.goals'), icon: Target },
        { href: '/achievements', label: 'Achievements', icon: Trophy },
        { href: '/recurring', label: t('sidebar.recurring'), icon: Repeat },
        { href: '/debts', label: t('debts.title'), icon: Handshake },
        { href: '/calendar', label: t('calendar.title'), icon: CalendarDays },
        { href: '/reports', label: 'Laporan', icon: FileText },
    ];

    return (
        <>
            {/* Bottom Spacer */}
            <div className="h-20 md:h-24"></div>

            {/* Floating Menu Container */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
                <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-600 dark:text-gray-400 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 px-4 py-3 flex justify-between items-center">
                    {mainNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Tooltip key={item.href} content={item.label}>
                                <Link
                                    href={item.href}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive
                                        ? 'text-primary bg-primary/10'
                                        : 'hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                </Link>
                            </Tooltip>
                        );
                    })}

                    {/* More Button */}
                    <Tooltip content="Lainnya">
                        <button
                            onClick={() => setIsMoreOpen(!isMoreOpen)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isMoreOpen
                                ? 'text-primary bg-primary/10'
                                : 'hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                        >
                            {isMoreOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </Tooltip>
                </nav>
            </div>

            {/* More Menu Overlay/Drawer */}
            {isMoreOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                        onClick={() => setIsMoreOpen(false)}
                    />
                    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 animate-slideIn">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col p-2">
                            {/* Profile Header with Settings */}
                            <div className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-slate-700 mb-2">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-bold truncate text-slate-900 dark:text-white">{user?.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">@{user?.name?.toLowerCase().replace(/\s/g, '')}</p>
                                </div>
                                <Link
                                    href="/settings"
                                    onClick={() => setIsMoreOpen(false)}
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    <Settings size={18} className="text-slate-600 dark:text-slate-300" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {moreNavItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMoreOpen(false)}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                <Icon size={18} />
                                            </div>
                                            <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            <button
                                onClick={logout}
                                className="mt-2 flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 transition-colors w-full"
                            >
                                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
                                    <LogOut size={18} />
                                </div>
                                <span className="font-medium text-sm">{t('sidebar.logout')}</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
