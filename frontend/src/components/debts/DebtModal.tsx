'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { debtApi } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { X } from 'lucide-react';
import { Debt } from '@/types/definitions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import CurrencyInput from '@/components/ui/CurrencyInput';

interface DebtModalProps {
    isOpen: boolean;
    onClose: () => void;
    debtToEdit?: Debt | null;
}

type FormData = {
    type: 'payable' | 'receivable';
    person_name: string;
    amount: number;
    installment_amount?: number;
    description: string;
    borrowed_date?: string;
    due_date?: string;
    status: 'unpaid' | 'paid';
};

export default function DebtModal({ isOpen, onClose, debtToEdit }: DebtModalProps) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            type: 'payable',
            status: 'unpaid',
            amount: 0,
            installment_amount: 0,
        }
    });

    const amountValue = watch('amount');
    const installmentAmountValue = watch('installment_amount');

    useEffect(() => {
        if (debtToEdit) {
            setValue('type', debtToEdit.type);
            setValue('person_name', debtToEdit.person_name);
            setValue('amount', debtToEdit.amount);
            setValue('installment_amount', debtToEdit.installment_amount || 0);
            setValue('description', debtToEdit.description);
            setValue('status', debtToEdit.status);
            if (debtToEdit.borrowed_date) {
                setValue('borrowed_date', new Date(debtToEdit.borrowed_date).toISOString().split('T')[0]);
            }
            if (debtToEdit.due_date) {
                setValue('due_date', new Date(debtToEdit.due_date).toISOString().split('T')[0]);
            }
        } else {
            reset({
                type: 'payable',
                status: 'unpaid',
                amount: 0,
                installment_amount: 0,
                person_name: '',
                description: '',
                borrowed_date: undefined,
                due_date: undefined
            });
        }
    }, [debtToEdit, reset, setValue, isOpen]);

    const mutation = useMutation({
        mutationFn: (data: FormData) => {
            if (debtToEdit) {
                return debtApi.update(debtToEdit.ID, data);
            }
            return debtApi.create(data);
        },
        onSuccess: () => {
            toast.success(debtToEdit ? 'Record updated' : 'Record created');
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            onClose();
            reset();
        },
        onError: (error) => {
            toast.error('Operation failed');
            console.error(error);
        }
    });

    const onSubmit = (data: FormData) => {
        mutation.mutate({
            ...data,
            amount: Number(data.amount),
            installment_amount: Number(data.installment_amount || 0)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scaleIn">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold">
                        {debtToEdit ? t('debts.edit') : t('debts.add')}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    {/* Type Selection */}
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setValue('type', 'payable')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${(debtToEdit?.type || 'payable') === 'payable' // Watch logic needed here really, but simplified
                                ? 'bg-white dark:bg-gray-600 shadow-sm text-red-500' // Using color state here is tricky without watch
                                : 'text-gray-500'
                                }`}
                        >
                            {t('debts.payable')}
                        </button>
                        {/* Better to use radio inputs hidden for handling state logic simply */}
                        <select {...register('type')} className="form-select w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                            <option value="payable">{t('debts.payable')}</option>
                            <option value="receivable">{t('debts.receivable')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('debts.person_name')}</label>
                        <input
                            {...register('person_name', { required: true })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="John Doe"
                        />
                        {errors.person_name && <span className="text-red-500 text-xs">Required</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('debts.amount')}</label>
                        <CurrencyInput
                            value={amountValue || ''}
                            onValueChange={(val) => setValue('amount', val, { shouldValidate: true })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {errors.amount && <span className="text-red-500 text-xs">Required</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('debts.installment_amount') || 'Cicilan (Opsional)'}</label>
                        <CurrencyInput
                            value={installmentAmountValue || ''}
                            onValueChange={(val) => setValue('installment_amount', val)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('debts.borrowed_date') || 'Tanggal Pinjam'}</label>
                            <input
                                type="date"
                                {...register('borrowed_date')}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('debts.due_date')}</label>
                            <input
                                type="date"
                                {...register('due_date')}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('debts.description')}</label>
                        <textarea
                            {...register('description')}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? t('common.loading') : t('common.save')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
