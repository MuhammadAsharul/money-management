'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { debtApi, walletsApi, categoriesApi } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { X } from 'lucide-react';
import { Debt, Wallet, Category } from '@/types/definitions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import CurrencyInput from '@/components/ui/CurrencyInput';

interface PayInstallmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    debt?: Debt | null;
}

type FormData = {
    amount: number;
    wallet_id: number;
    category_id: number;
    date: string;
};

export default function PayInstallmentModal({ isOpen, onClose, debt }: PayInstallmentModalProps) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    // Fetch data for dropdowns
    const { data: wallets } = useQuery({ queryKey: ['wallets'], queryFn: walletsApi.list, enabled: isOpen });

    // Make sure we fetch both income and expense categories, or specific ones.
    // If we pay a payable (hutang kita), it's an expense. If we receive a receivable (piutang), it's an income.
    const categoryType = debt?.type === 'payable' ? 'expense' : 'income';
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesApi.list(),
        enabled: isOpen
    });

    // Filter categories based on transaction type
    const filteredCategories = Array.isArray(categories) ? categories.filter((c: Category) => c.type === categoryType) : [];

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            amount: 0,
            wallet_id: undefined,
            category_id: undefined,
            date: new Date().toISOString().split('T')[0],
        }
    });

    const amountValue = watch('amount');

    useEffect(() => {
        if (isOpen && debt && debt.installment_amount && debt.installment_amount > 0) {
            setValue('amount', debt.installment_amount);
        } else if (isOpen && debt && debt.remaining_amount) {
            // Suggest remaining amount if there's no fixed installment
            setValue('amount', debt.remaining_amount);
        }

        // Auto-select first wallet if available
        if (isOpen && Array.isArray(wallets) && wallets.length > 0) {
            const defaultWallet = wallets.find((w: Wallet) => w.is_default) || wallets[0];
            setValue('wallet_id', defaultWallet.id);
        }

    }, [isOpen, debt, wallets, setValue]);

    const mutation = useMutation({
        mutationFn: (data: FormData) => {
            if (!debt) throw new Error('Debt is required');
            return debtApi.payInstallment(debt.ID, data);
        },
        onSuccess: () => {
            toast.success(t('debts.pay_success') || 'Pembayaran cicilan berhasil disimpan');
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            onClose();
            reset();
        },
        onError: (error) => {
            toast.error(t('common.error_save') || 'Failed to save');
            console.error(error);
        }
    });

    const onSubmit = (data: FormData) => {
        if (!data.wallet_id || !data.category_id) {
            toast.error('Harap pilih Kantong (Wallet) dan Kategori');
            return;
        }
        mutation.mutate({
            ...data,
            wallet_id: Number(data.wallet_id),
            category_id: Number(data.category_id),
            amount: Number(data.amount)
        });
    };

    if (!isOpen || !debt) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scaleIn">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold">
                        {t('debts.pay_installment') || 'Bayar Cicilan'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm mb-4">
                        <p className="text-gray-500 mb-1">{debt.type === 'payable' ? t('debts.payable') : t('debts.receivable')}</p>
                        <p className="font-semibold text-base">{debt.person_name}</p>
                        <p className="mt-2 text-gray-500">Sisa Utang: <span className="font-bold text-gray-900 dark:text-gray-100">Rp {debt.remaining_amount?.toLocaleString('id-ID')}</span></p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('debts.amount') || 'Jumlah Pembayaran'}</label>
                        <CurrencyInput
                            value={amountValue || ''}
                            onValueChange={(val) => setValue('amount', val, { shouldValidate: true })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {errors.amount && <span className="text-red-500 text-xs">Required</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('transactions.wallet') || 'Sumber Dana'}</label>
                        <select
                            {...register('wallet_id', { required: true })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">Pilih Dompet...</option>
                            {Array.isArray(wallets) && wallets.map((w: Wallet) => (
                                <option key={w.id} value={w.id}>
                                    {w.icon} {w.name} ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(w.balance)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('categories.title') || 'Kategori'}</label>
                        <select
                            {...register('category_id', { required: true })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">Pilih Kategori...</option>
                            {filteredCategories.map((c: Category) => (
                                <option key={c.id} value={c.id}>
                                    {c.icon} {c.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            {debt.type === 'payable' ? 'Kategori Pengeluaran' : 'Kategori Pemasukan'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('common.date') || 'Tanggal'}</label>
                        <input
                            type="date"
                            {...register('date')}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? t('common.loading') : 'Bayar Cicilan'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
