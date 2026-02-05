'use client';

import { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { DashboardSummary } from '@/types/definitions';

interface DashboardChartsProps {
    data: DashboardSummary;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

import { useLanguage } from '@/lib/language-context';

export default function DashboardCharts({ data }: DashboardChartsProps) {
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false); 

    useEffect(() => {
        setMounted(true);
    }, []);
    // Process trends data
    // Ensure we have data even if empty
    const trendsData = data.daily_trends || [];
    const spendingData = data.category_spending || [];

    if (!mounted) return <div className="h-64" />;
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Income vs Expense Trend */}
            <div className="card p-6">
                <h3 className="text-lg font-bold mb-4">{t('dashboard.financial_trend')}</h3>
                <div className="h-64 min-w-0">
                    {trendsData.length > 0 ? (
                        <ResponsiveContainer width="100%" aspect={2}>
                            <AreaChart data={trendsData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        return `${date.getDate()}/${date.getMonth() + 1}`;
                                    }}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${val / 1000}k`}
                                />
                                <Tooltip
                                    formatter={(value: number | undefined) => formatCurrency(value || 0)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelFormatter={(label) => {
                                        const date = new Date(label);
                                        return date.toLocaleDateString();
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                    name={t('dashboard.income')}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expense"
                                    stroke="#EF4444"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorExpense)"
                                    name={t('dashboard.expense')}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <p>{t('dashboard.no_transactions')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Pie Chart */}
            <div className="card p-6">
                <h3 className="text-lg font-bold mb-4">{t('dashboard.expense_by_category')}</h3>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="h-64 w-full md:w-1/2 min-w-0">
                        {spendingData.length > 0 ? (
                            <ResponsiveContainer width="100%" aspect={1}>
                                <PieChart>
                                    <Pie
                                        data={spendingData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="amount"
                                        nameKey="category_name"
                                    >
                                        {spendingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0)} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <p>{t('categories.no_categories')}</p>
                            </div>
                        )}
                    </div>
                    <div className="w-full md:w-1/2 space-y-3">
                        {spendingData.length > 0 ? spendingData.slice(0, 5).map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: cat.color || COLORS[idx % COLORS.length] }}
                                    />
                                    <span className="truncate max-w-[100px]">{cat.category_name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold">{Math.round(cat.percentage)}%</span>
                                    {cat.change_pct !== undefined && cat.change_pct !== 100 && cat.change_pct !== 0 && (
                                        <span className={`text-xs flex items-center ${cat.change_pct > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {cat.change_pct > 0 ? '↑' : '↓'} {Math.abs(cat.change_pct).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        )) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
