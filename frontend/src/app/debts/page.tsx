'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtApi } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { Card } from '@/components/ui/Card';
import { Plus, Handshake, ArrowUpRight, ArrowDownLeft, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Debt } from '@/types/definitions';
import { Button } from '@/components/ui/Button';
import DebtModal from '@/components/debts/DebtModal';
import FloatingMenu from '@/components/layout/FloatingMenu';

export default function DebtsPage() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'payable' | 'receivable'>('payable');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

    // Fetch Debts
    const { data: debts, isLoading } = useQuery({
        queryKey: ['debts', activeTab],
        queryFn: () => debtApi.getAll(activeTab),
    });

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: debtApi.delete,
        onSuccess: () => {
            toast.success('Record deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['debts'] });
        },
        onError: () => toast.error('Failed to delete record'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Debt> }) => debtApi.update(id, data),
        onSuccess: () => {
            toast.success('Record updated successfully');
            queryClient.invalidateQueries({ queryKey: ['debts'] });
        },
        onError: () => toast.error('Failed to update record'),
    });

    const handleDelete = (id: number) => {
        if (confirm(t('debts.delete_confirm'))) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleStatus = (debt: Debt) => {
        const newStatus = debt.status === 'paid' ? 'unpaid' : 'paid';
        updateMutation.mutate({ id: debt.ID, data: { status: newStatus } });
    };

    const handleAdd = () => {
        setSelectedDebt(null);
        setIsModalOpen(true);
    };

    const handleEdit = (debt: Debt) => {
        setSelectedDebt(debt);
        setIsModalOpen(true);
    };

    // Calculate Totals
    const totalAmount = debts?.reduce((acc, curr) => acc + (curr.status === 'unpaid' ? curr.amount : 0), 0) || 0;

    return (
        <div className="p-4 md:p-6 pb-32 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Handshake className="text-orange-500" />
                        {t('debts.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">{t('debts.subtitle')}</p>
                </div>
                <Button onClick={handleAdd} className="flex items-center gap-2">
                    <Plus size={16} />
                    <span className="hidden md:inline">{t('debts.add')}</span>
                </Button>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={`p-6 border-l-4 ${activeTab === 'payable' ? 'border-l-red-500' : 'border-l-green-500'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {activeTab === 'payable' ? t('debts.total_payable') : t('debts.total_receivable')} ({t('debts.unpaid')})
                            </p>
                            <h3 className={`text-2xl font-bold mt-1 ${activeTab === 'payable' ? 'text-red-500' : 'text-green-500'}`}>
                                {formatCurrency(totalAmount)}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-full ${activeTab === 'payable' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}>
                            {activeTab === 'payable' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'payable' ? 'text-orange-500' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('payable')}
                >
                    {t('debts.my_debt')}
                    {activeTab === 'payable' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500" />}
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'receivable' ? 'text-orange-500' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('receivable')}
                >
                    {t('debts.others_debt')}
                    {activeTab === 'receivable' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500" />}
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-500">Loading...</div>
                ) : debts?.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">{t('debts.no_debts')}</div>
                ) : (
                    debts?.map((debt) => (
                        <Card
                            key={debt.ID}
                            className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleEdit(debt)}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-lg">{debt.person_name}</h4>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${debt.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                        {debt.status === 'paid' ? t('debts.paid') : t('debts.unpaid')}
                                    </span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{debt.description}</p>
                                {debt.due_date && (
                                    <p className="text-xs text-orange-500 flex items-center gap-1">
                                        📅 {t('debts.due_date')}: {new Date(debt.due_date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end" onClick={(e) => e.stopPropagation()}>
                                <span className={`font-bold text-lg ${debt.type === 'payable' ? 'text-red-500' : 'text-green-500'}`}>
                                    {formatCurrency(debt.amount)}
                                </span>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleStatus(debt)}
                                        title={debt.status === 'paid' ? t('debts.mark_unpaid') : t('debts.mark_paid')}
                                        className={debt.status === 'paid' ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}
                                    >
                                        {debt.status === 'paid' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(debt.ID)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <DebtModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                debtToEdit={selectedDebt}
            />
            <FloatingMenu />
        </div>
    );
}
