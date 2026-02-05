import React, { useEffect, useState } from 'react';
import { Transaction } from '@/types/definitions';
import { transactionsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { X, Calendar } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

interface BudgetDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    categoryId: number;
    categoryName: string;
    month: number;
    year: number;
}

export default function BudgetDetailsModal({
    isOpen,
    onClose,
    categoryId,
    categoryName,
    month,
    year,
}: BudgetDetailsModalProps) {
    const { t } = useLanguage();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && categoryId) {
            loadTransactions();
        }
    }, [isOpen, categoryId, month, year]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            // Calculate start and end date for filtering
            // Format as YYYY-MM-DD manually to avoid timezone issues
            const getFormattedDate = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of month

            const data = await transactionsApi.list(1, 100, {
                category_id: categoryId,
                type: 'expense',
                start_date: getFormattedDate(startDate),
                end_date: getFormattedDate(endDate),
            });
            setTransactions(data.transactions || []);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-semibold">{t('budgets.details')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {categoryName} • {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                    ) : transactions.length > 0 ? (
                        <div className="space-y-3">
                            {transactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                                            <Calendar size={16} className="text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{tx.description || t('common.no_description')}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(tx.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-semibold text-red-500">
                                        -{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            {t('transactions.no_transactions')}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{t('common.total')}</span>
                        <span className="font-bold text-lg">
                            {formatCurrency(transactions.reduce((acc, curr) => acc + curr.amount, 0))}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
