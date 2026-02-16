'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { analyticsApi } from '@/lib/api';
import { NetWorthResponse } from '@/types/definitions';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import NetWorthChart from '../charts/NetWorthChart';

export default function NetWorthCard() {
    const [data, setData] = useState<NetWorthResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            console.log('[NetWorthCard] Starting to load data...');
            try {
                const response = await analyticsApi.getNetWorth();
                console.log('[NetWorthCard] Data received:', response);
                setData(response);
            } catch (error) {
                console.error('[NetWorthCard] Failed to load net worth:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <Card className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="h-40 bg-gray-200 rounded w-full"></div>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card className="p-6 text-center">
                <p className="text-gray-500">Failed to load Net Worth data.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-blue-500 text-sm mt-2 hover:underline"
                >
                    Retry
                </button>
            </Card>
        );
    }

    return (
        <Card className="p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none dark:bg-purple-900/40"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                            Current Net Worth
                        </h2>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.net_worth)}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Assets vs Liabilities Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800/30">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-green-100 dark:bg-green-800/50 rounded-lg text-green-600 dark:text-green-400">
                                <Wallet size={16} />
                            </div>
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">Total Assets</span>
                        </div>
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">
                            {formatCurrency(data.total_assets)}
                        </p>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800/30">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-red-100 dark:bg-red-800/50 rounded-lg text-red-600 dark:text-red-400">
                                <CreditCard size={16} />
                            </div>
                            <span className="text-xs font-medium text-red-700 dark:text-red-400">Liabilities</span>
                        </div>
                        <p className="text-lg font-bold text-red-700 dark:text-red-300">
                            {formatCurrency(data.total_liabilities)}
                        </p>
                    </div>
                </div>

                {/* Chart */}
                <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-2">History (Last 6 Months)</h4>
                    <NetWorthChart data={data.history} />
                </div>
            </div>
        </Card>
    );
}
