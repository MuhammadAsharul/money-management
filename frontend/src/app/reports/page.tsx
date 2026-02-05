'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { reportsApi } from '@/lib/api';
import { MonthlyReport } from '@/types/definitions';
import FloatingMenu from '@/components/layout/FloatingMenu';
import { Card } from '@/components/ui/Card';
import {
    FileText,
    TrendingUp,
    TrendingDown,
    PiggyBank,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ArrowUp,
    ArrowDown,
    Download
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#EF8354', '#4F5D75', '#2D3142', '#BFC0C0', '#F7B32B', '#6B8F71', '#3D5A80', '#E07A5F'];

const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function ReportsPage() {
    const router = useRouter();
    const { token, loading: authLoading } = useAuth();
    const { t } = useLanguage();

    const [selectedYear, setSelectedYear] = useState<number>(0);
    const [selectedMonth, setSelectedMonth] = useState<number>(0);
    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const date = new Date();
        setSelectedYear(date.getFullYear());
        setSelectedMonth(date.getMonth() + 1);
    }, []);

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/');
        }
    }, [token, authLoading, router]);

    useEffect(() => {
        if (token && isMounted && selectedYear !== 0) {
            fetchReport();
        }
    }, [token, selectedYear, selectedMonth, isMounted]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const data = await reportsApi.getMonthly(selectedYear, selectedMonth);
            setReport(data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const goToPreviousMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const isCurrentMonth = isMounted && selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth() + 1;

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24">
            <FloatingMenu />

            <main className="max-w-4xl mx-auto p-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-12 lg:pt-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <FileText className="text-primary" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Laporan Bulanan</h1>
                            <p style={{ color: 'rgb(var(--muted))' }}>Ringkasan keuangan Anda</p>
                        </div>
                    </div>
                </div>

                {/* Month Selector */}
                <Card className="mb-6">
                    <div className="flex items-center justify-between p-4">
                        <button
                            onClick={goToPreviousMonth}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Calendar size={20} style={{ color: 'rgb(var(--muted))' }} />
                            <span className="text-xl font-semibold">
                                {selectedYear !== 0 ? `${monthNames[selectedMonth - 1]} ${selectedYear}` : 'Loading...'}
                            </span>
                        </div>
                        <button
                            onClick={goToNextMonth}
                            disabled={isCurrentMonth}
                            className={`p-2 rounded-lg transition-colors ${isCurrentMonth
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </Card>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : report ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* Income */}
                            <Card className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <TrendingUp className="text-green-600" size={20} />
                                    </div>
                                    <span style={{ color: 'rgb(var(--muted))' }}>Pemasukan</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(report.total_income)}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    {report.comparison.income_change >= 0 ? (
                                        <ArrowUp size={14} className="text-green-500" />
                                    ) : (
                                        <ArrowDown size={14} className="text-red-500" />
                                    )}
                                    <span className={report.comparison.income_change >= 0 ? 'text-green-500' : 'text-red-500'}>
                                        {Math.abs(report.comparison.income_change).toFixed(1)}%
                                    </span>
                                    <span style={{ color: 'rgb(var(--muted))' }}>dari bulan lalu</span>
                                </div>
                            </Card>

                            {/* Expense */}
                            <Card className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                        <TrendingDown className="text-red-600" size={20} />
                                    </div>
                                    <span style={{ color: 'rgb(var(--muted))' }}>Pengeluaran</span>
                                </div>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatCurrency(report.total_expense)}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    {report.comparison.expense_change <= 0 ? (
                                        <ArrowDown size={14} className="text-green-500" />
                                    ) : (
                                        <ArrowUp size={14} className="text-red-500" />
                                    )}
                                    <span className={report.comparison.expense_change <= 0 ? 'text-green-500' : 'text-red-500'}>
                                        {Math.abs(report.comparison.expense_change).toFixed(1)}%
                                    </span>
                                    <span style={{ color: 'rgb(var(--muted))' }}>dari bulan lalu</span>
                                </div>
                            </Card>

                            {/* Savings */}
                            <Card className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <PiggyBank className="text-blue-600" size={20} />
                                    </div>
                                    <span style={{ color: 'rgb(var(--muted))' }}>Tabungan</span>
                                </div>
                                <p className={`text-2xl font-bold ${report.net_savings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {formatCurrency(report.net_savings)}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    <span style={{ color: 'rgb(var(--muted))' }}>
                                        Rasio tabungan: {report.savings_rate.toFixed(1)}%
                                    </span>
                                </div>
                            </Card>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Daily Trend */}
                            <Card className="p-5">
                                <h3 className="font-semibold mb-4">Tren Harian</h3>
                                {report.daily_trend && report.daily_trend.length > 0 ? (
                                    <div className="w-full" style={{ height: 200, minWidth: 0 }}>
                                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                            <AreaChart data={report.daily_trend}>
                                                <defs>
                                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 10 }}
                                                    tickFormatter={(val) => new Date(val).getDate().toString()}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 10 }}
                                                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}jt`}
                                                />
                                                <Tooltip
                                                    formatter={(value) => formatCurrency(value as number)}
                                                    labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID')}
                                                />
                                                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incomeGradient)" />
                                                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGradient)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-gray-400">
                                        Tidak ada data
                                    </div>
                                )}
                            </Card>

                            {/* Category Breakdown */}
                            <Card className="p-5">
                                <h3 className="font-semibold mb-4">Pengeluaran per Kategori</h3>
                                {report.category_breakdown && report.category_breakdown.length > 0 ? (
                                    <div className="w-full" style={{ height: 200, minWidth: 0 }}>
                                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                            <PieChart>
                                                <Pie
                                                    data={report.category_breakdown}
                                                    dataKey="amount"
                                                    nameKey="category_name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                >
                                                    {report.category_breakdown.map((entry, index) => (
                                                        <Cell key={entry.category_id} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value) => formatCurrency(value as number)}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-gray-400">
                                        Tidak ada data pengeluaran
                                    </div>
                                )
                                }
                            </Card>
                        </div>

                        {/* Category Breakdown List */}
                        {report.category_breakdown && report.category_breakdown.length > 0 && (
                            <Card className="p-5 mb-6">
                                <h3 className="font-semibold mb-4">Rincian Pengeluaran</h3>
                                <div className="space-y-3">
                                    {[...report.category_breakdown]
                                        .sort((a, b) => b.amount - a.amount)
                                        .map((cat, index) => (
                                            <div key={cat.category_id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                    />
                                                    <span className="text-xl">{cat.category_icon}</span>
                                                    <span>{cat.category_name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">{formatCurrency(cat.amount)}</p>
                                                    <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                                                        {cat.percentage.toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </Card>
                        )}

                        {/* Stats */}
                        <Card className="p-5">
                            <h3 className="font-semibold mb-4">Statistik Bulan Ini</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p style={{ color: 'rgb(var(--muted))' }}>Total Transaksi</p>
                                    <p className="text-2xl font-bold">{report.transaction_count}</p>
                                </div>
                                <div>
                                    <p style={{ color: 'rgb(var(--muted))' }}>Kategori Aktif</p>
                                    <p className="text-2xl font-bold">{report.category_breakdown?.length || 0}</p>
                                </div>
                            </div>
                        </Card>
                    </>
                ) : (
                    <Card className="p-8 text-center">
                        <FileText size={48} className="mx-auto mb-4 opacity-30" />
                        <p style={{ color: 'rgb(var(--muted))' }}>Tidak ada data untuk bulan ini</p>
                    </Card>
                )}
            </main>
        </div>
    );
}
