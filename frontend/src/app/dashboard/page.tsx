'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import FinancialHealth from '@/components/dashboard/FinancialHealth';
import GamificationCard from '@/components/gamification/GamificationCard';
import { dashboardApi, analyticsApi, gamificationApi } from '@/lib/api';
import { DashboardSummary, FinancialScoreResponse, GamificationStatus } from '@/types/definitions';
import { formatCurrency, getGreeting, formatDateShort } from '@/lib/utils';
import FloatingMenu from '@/components/layout/FloatingMenu';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

import { useLanguage } from '@/lib/language-context';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading, token } = useAuth();
    const { t } = useLanguage();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [financialScore, setFinancialScore] = useState<FinancialScoreResponse | null>(null);
    const [gamificationStatus, setGamificationStatus] = useState<GamificationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('monthly');

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        if (token) {
            loadDashboard();
        }
    }, [token, period]);

    const loadDashboard = async () => {
        try {
            const [data, score, gamification] = await Promise.all([
                dashboardApi.getSummary(period),
                analyticsApi.getScore(),
                gamificationApi.getStatus()
            ]);
            setSummary(data);
            setFinancialScore(score);
            setGamificationStatus(gamification);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (!token) return null;



    return (
        <div className="min-h-screen pb-24">
            <FloatingMenu />

            <main className="max-w-md mx-auto p-4 md:max-w-2xl lg:max-w-4xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-12 lg:pt-0">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            {t('dashboard.greeting')}, <span className="">{user?.name?.split(' ')[0]}</span>! 👋
                        </h1>
                        <p style={{ color: 'rgb(var(--muted))' }}>{t('dashboard.summary_title')}</p>
                    </div>

                    {/* Period Selector */}
                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700 w-fit">
                        {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${period === p
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                {t(`dashboard.periods.${p}`)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gamification Card */}
                <div className="mb-6">
                    <GamificationCard status={gamificationStatus} loading={loading} />
                </div>

                {/* Financial Health Score (New) */}
                <div className="mb-8">
                    <FinancialHealth data={financialScore} loading={loading} />
                </div>

                {/* Alerts */}
                {summary && summary.monthly_expense > summary.monthly_income && (
                    <div className="mb-6 animate-fade-in">
                        <Alert variant="error" title={t('dashboard.overspending_alert') || 'Warning: Overspending Detected!'}>
                            <p>
                                {t('dashboard.overspending_desc') || `Your monthly expenses (${formatCurrency(summary.monthly_expense)}) exceed your income (${formatCurrency(summary.monthly_income)}).`}
                            </p>
                        </Alert>
                    </div>
                )}

                {summary?.budget_progress?.some(b => b.percentage >= 90) && (
                    <div className="mb-6">
                        <Alert variant="warning" title={t('dashboard.budget_alert')}>
                            <div className="space-y-1 mt-1">
                                {summary.budget_progress.filter(b => b.percentage >= 90).map((b, idx) => (
                                    <p key={idx}>
                                        {t('dashboard.budget_alert_desc', { category: b.category_name, percent: b.percentage.toFixed(0) })}
                                    </p>
                                ))}
                            </div>
                        </Alert>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Balance */}
                    <Card hoverEffect className="border-l-4 border-l-orange-500">
                        <div className="flex items-center justify-between mb-4">
                            <span className="stat-label font-medium">{t('dashboard.balance')}</span>
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <Wallet size={20} className="text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                        <p className={`stat-value text-3xl ${(summary?.balance || 0) >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                            {formatCurrency(summary?.balance || 0)}
                        </p>
                    </Card>

                    {/* Income */}
                    <Card hoverEffect className="border-l-4 border-l-emerald-500">
                        <div className="flex items-center justify-between mb-2">
                            <span className="stat-label font-medium">{t('dashboard.income')}</span>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30">
                                <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <p className="stat-value positive mb-1 text-2xl text-emerald-600 dark:text-emerald-400">{formatCurrency(summary?.total_income || 0)}</p>
                        {summary?.income_change_pct !== undefined && (
                            <p className={`text-xs flex items-center gap-1 font-medium ${summary.income_change_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {summary.income_change_pct >= 0 ? '↑' : '↓'} {Math.abs(summary.income_change_pct).toFixed(1)}% {t('dashboard.vs_previous')}
                            </p>
                        )}
                    </Card>

                    {/* Expense */}
                    <Card hoverEffect className="border-l-4 border-l-red-500">
                        <div className="flex items-center justify-between mb-2">
                            <span className="stat-label font-medium">{t('dashboard.expense')}</span>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                                <TrendingDown size={16} className="text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <p className="stat-value negative mb-1 text-2xl text-red-600 dark:text-red-400">{formatCurrency(summary?.total_expense || 0)}</p>
                        {summary?.expense_change_pct !== undefined && (
                            <p className={`text-xs flex items-center gap-1 font-medium ${summary.expense_change_pct <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {summary.expense_change_pct > 0 ? '↑' : '↓'} {Math.abs(summary.expense_change_pct).toFixed(1)}% {t('dashboard.vs_previous')}
                            </p>
                        )}
                    </Card>
                </div>

                {/* Charts */}
                {summary && <DashboardCharts data={summary} />}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


                    {/* Recent Transactions */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">{t('dashboard.recent_transactions')}</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/transactions')}
                                className="text-orange-500 hover:text-orange-600 font-medium"
                            >
                                {t('dashboard.see_all')}
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {summary?.recent_transactions?.length ? (
                                summary.recent_transactions.map((tx: any) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-3 rounded-lg space-x-3"
                                        style={{ background: 'rgb(var(--secondary))' }}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                                            <span className="text-xl shrink-0">{tx.category?.icon || '💰'}</span>
                                            <div className="min-w-0 truncate">
                                                <p className="font-medium truncate">{tx.description || tx.category?.name}</p>
                                                <p className="text-sm truncate" style={{ color: 'rgb(var(--muted))' }}>
                                                    {formatDateShort(tx.date)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {tx.category?.name?.toLowerCase().includes('transfer') ? (
                                                <>
                                                    <ArrowUpRight size={16} className="text-blue-500" />
                                                    <span className="font-medium text-blue-500">
                                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                    </span>
                                                </>
                                            ) : tx.type === 'income' ? (
                                                <>
                                                    <ArrowUpRight size={16} style={{ color: 'rgb(var(--accent))' }} />
                                                    <span className="font-medium text-green-500">
                                                        +{formatCurrency(tx.amount)}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowDownRight size={16} style={{ color: 'rgb(var(--danger))' }} />
                                                    <span className="font-medium text-red-500">
                                                        -{formatCurrency(tx.amount)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8" style={{ color: 'rgb(var(--muted))' }}>
                                    {t('dashboard.no_transactions')}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Budget Progress */}
                    {summary?.budget_progress && summary.budget_progress.length > 0 && (
                        <Card>
                            <h3 className="font-semibold mb-4">{t('dashboard.budget_progress')}</h3>
                            <div className="space-y-4">
                                {summary.budget_progress.map((budget, index) => (
                                    <div key={index} className="p-4 rounded-lg" style={{ background: 'rgb(var(--secondary))' }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">{budget.category_name}</span>
                                            <span className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                                                {budget.percentage.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${Math.min(budget.percentage, 100)}%`,
                                                    background: budget.percentage > 90 ? 'rgb(var(--danger))' : 'rgb(var(--primary))'
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2 text-sm" style={{ color: 'rgb(var(--muted))' }}>
                                            <span>{formatCurrency(budget.spent_amount)}</span>
                                            <span>{formatCurrency(budget.budget_amount)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
