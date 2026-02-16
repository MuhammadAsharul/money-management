'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { NetWorthHistory } from '@/types/definitions';
import { formatCurrency } from '@/lib/utils';

interface NetWorthChartProps {
    data: NetWorthHistory[];
}

export default function NetWorthChart({ data }: NetWorthChartProps) {
    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500 py-10">No data available</div>;
    }

    return (
        <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis
                        hide
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={(value: number | undefined) => [formatCurrency(value || 0), 'Net Worth']}
                        labelStyle={{ color: '#374151', fontWeight: 600 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#8B5CF6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorNetWorth)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
