'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    Tags,
    LogOut,
    Menu,
    X,
    MoreHorizontal,
    Target,
    Download,
    Settings,
    Repeat,
    Trophy,
    Handshake
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/wallets', label: 'Kantong', icon: Wallet },
    { href: '/transactions', label: 'Transaksi', icon: Receipt },
    { href: '/budgets', label: 'Budget', icon: Wallet },
    { href: '/categories', label: 'Kategori', icon: Tags },
    { href: '/goals', label: 'Target', icon: Target },
    { href: '/recurring', label: 'Rutin', icon: Repeat },
];

import { useLanguage } from '@/lib/language-context';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const navItems = [
        { href: '/dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
        { href: '/wallets', label: t('sidebar.wallets'), icon: Wallet },
        { href: '/transactions', label: t('sidebar.transactions'), icon: Receipt },
        { href: '/budgets', label: t('sidebar.budgets'), icon: Wallet },
        { href: '/goals', label: t('sidebar.goals'), icon: Target },
        { href: '/debts', label: t('debts.title'), icon: Handshake },
        { href: '/achievements', label: 'Achievements', icon: Trophy },
        { href: '/recurring', label: t('sidebar.recurring'), icon: Repeat },
    ];

    const handleBackup = async () => {
        try {
            toast.loading('Downloading backup...');
            const response = await api.get('/data/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `money-tracker-backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.dismiss();
            toast.success('Backup downloaded successfully');
        } catch (error) {
            console.error('Backup failed:', error);
            toast.error('Failed to download backup');
        }
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md lg:hidden"
                style={{ background: 'rgb(var(--card))' }}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Theme & Language Toggle - Fixed Bottom Right */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                <button
                    onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                    className="p-3 shadow-lg rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                >
                    {language === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
                </button>
                <div className="shadow-lg rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <ThemeToggle />
                </div>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 z-40 transform transition-transform duration-300 lg:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
                style={{
                    background: 'rgb(var(--card))',
                    borderRight: '1px solid rgb(var(--border))'
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Wallet className="text-orange-500" size={28} />
                            <span>MoneyTracker</span>
                        </h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4">
                        <ul className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            <Icon size={20} />
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t relative" style={{ borderColor: 'rgb(var(--border))' }}>
                        {isProfileOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40 bg-transparent"
                                    onClick={() => setIsProfileOpen(false)}
                                />
                                <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-1 animate-fadeIn">
                                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/50 mb-1 space-y-1">
                                        <p className="font-medium text-sm">{t('sidebar.profile')}</p>
                                        <Link
                                            href="/settings"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="w-full text-left px-2 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center justify-between"
                                        >
                                            <span>{t('sidebar.settings')}</span>
                                            <Settings size={14} />
                                        </Link>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-between"
                                    >
                                        <span>{t('sidebar.logout')} @{user?.name?.toLowerCase().replace(/\s/g, '')}</span>
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            </>
                        )}

                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-full flex items-center gap-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                style={{ background: 'rgb(var(--primary))' }}
                            >
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="font-medium truncate text-sm">{user?.name}</p>
                                <p className="text-xs truncate" style={{ color: 'rgb(var(--muted))' }}>
                                    @{user?.name?.toLowerCase().replace(/\s/g, '')}
                                </p>
                            </div>
                            <MoreHorizontal size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
