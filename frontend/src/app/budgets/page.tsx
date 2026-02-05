'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { budgetsApi, categoriesApi } from '@/lib/api';
import { Budget, Category } from '@/types/definitions';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';
import BudgetDetailsModal from '@/components/BudgetDetailsModal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import FloatingMenu from '@/components/layout/FloatingMenu';
import {
    Plus,
    X,
    Loader2,
    Pencil,
    Trash2,
    AlertTriangle,
    Eye
} from 'lucide-react';

import { useLanguage } from '@/lib/language-context';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function BudgetsPage() {
    const router = useRouter();
    const { token, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [formData, setFormData] = useState({
        category_id: 0,
        amount: 0,
        period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    });

    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        if (token) {
            loadData();
        }
    }, [token, selectedDate]); // Reload when date changes

    const loadData = async () => {
        try {
            const [budgetList, catList] = await Promise.all([
                budgetsApi.list(selectedDate.getMonth() + 1, selectedDate.getFullYear()),
                categoriesApi.list('expense'),
            ]);
            setBudgets(budgetList || []);
            setCategories(catList || []);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error(t('common.error_save'));
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(parseInt(e.target.value));
        setSelectedDate(newDate);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(parseInt(e.target.value));
        setSelectedDate(newDate);
    };

    // Get categories that don't have budgets yet
    const availableCategories = categories.filter(
        cat => !budgets.some(b => b.category_id === cat.id) || editingBudget?.category_id === cat.id
    );

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'weekly': return t('budgets.weekly');
            case 'monthly': return t('budgets.monthly');
            case 'yearly': return t('budgets.yearly');
            default: return period;
        }
    };

    const openEditModal = (budget: Budget) => {
        setEditingBudget(budget);
        setFormData({
            category_id: budget.category_id,
            amount: Number(budget.amount),
            period: budget.period,
        });
        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setShowConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await budgetsApi.delete(deleteId);
            loadData();
            toast.success(t('common.success_delete'));
            setShowConfirm(false);
        } catch (error) {
            console.error('Failed to delete budget:', error);
            toast.error(t('common.error_delete'));
        } finally {
            setDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...formData,
                amount: Number(formData.amount),
            };

            if (editingBudget) {
                await budgetsApi.update(editingBudget.id, payload);
            } else {
                await budgetsApi.create(payload);
            }

            setShowModal(false);
            resetForm();
            loadData();
            toast.success(t('common.success_save'));
        } catch (error) {
            console.error('Failed to save budget:', error);
            toast.error(t('common.error_save'));
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setEditingBudget(null);
        setFormData({
            category_id: 0,
            amount: 0,
            period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
        });
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-12 lg:pt-0">
                    <div>
                        <h1 className="text-2xl font-bold">{t('budgets.title')}</h1>
                        <p style={{ color: 'rgb(var(--muted))' }}>{t('budgets.subtitle')}</p>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-1">
                            <select
                                value={selectedDate.getMonth()}
                                onChange={handleMonthChange}
                                className="bg-transparent border-none outline-none text-sm p-1 cursor-pointer dark:bg-gray-800"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedDate.getFullYear()}
                                onChange={handleYearChange}
                                className="bg-transparent border-none outline-none text-sm p-1 cursor-pointer border-l dark:border-gray-700 dark:bg-gray-800"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <Button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            disabled={availableCategories.length === 0}
                            leftIcon={<Plus size={18} />}
                        >
                            {t('budgets.add')}
                        </Button>
                    </div>
                </div>

                {/* Budget Grid */}
                {budgets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {budgets.map((budget) => {
                            const isOverBudget = budget.percentage > 100;
                            const isWarning = budget.percentage > 80 && budget.percentage <= 100;

                            return (
                                <Card key={budget.id}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{budget.category?.icon || '📊'}</span>
                                            <div>
                                                <h3 className="font-semibold">{budget.category?.name}</h3>
                                                <p className="text-sm capitalize" style={{ color: 'rgb(var(--muted))' }}>
                                                    {getPeriodLabel(budget.period)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditModal(budget)}
                                                className="h-8 w-8"
                                            >
                                                <Pencil size={16} style={{ color: 'rgb(var(--muted))' }} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(budget.id)}
                                                className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">{formatCurrency(budget.spent)}</span>
                                            <span className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                                                {formatCurrency(budget.amount)}
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${Math.min(budget.percentage, 100)}%`,
                                                    background: isOverBudget
                                                        ? 'rgb(var(--danger))'
                                                        : isWarning
                                                            ? 'rgb(var(--warning))'
                                                            : 'rgb(var(--accent))'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`text-sm font-medium ${isOverBudget ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-green-500'
                                                }`}
                                        >
                                            {budget.percentage.toFixed(0)}% {t('budgets.used')}
                                        </span>
                                        {isOverBudget && (
                                            <div className="flex items-center gap-1 text-red-500 text-sm">
                                                <AlertTriangle size={14} />
                                                <span>{t('budgets.over_budget')}</span>
                                            </div>
                                        )}
                                        {!isOverBudget && (
                                            <span className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                                                {t('budgets.remaining')}: {formatCurrency(budget.remaining)}
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="text-center py-12">
                        <p style={{ color: 'rgb(var(--muted))' }}>{t('budgets.no_budgets')}</p>
                    </Card>
                )}
            </main>

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">
                                {editingBudget ? t('budgets.edit') : t('budgets.add')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">{t('categories.title')}</label>
                                <select
                                    className="input"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                                    required
                                    disabled={!!editingBudget}
                                >
                                    <option value={0}>{t('transactions.select_category')}</option>
                                    {availableCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">{t('budgets.amount')}</label>
                                <CurrencyInput
                                    value={formData.amount}
                                    onValueChange={(val) => setFormData({ ...formData, amount: val })}
                                    className="input"
                                    placeholder="Rp 0"
                                />
                            </div>

                            <div>
                                <label className="label">{t('budgets.period')}</label>
                                <select
                                    className="input"
                                    value={formData.period}
                                    onChange={(e) => setFormData({ ...formData, period: e.target.value as 'weekly' | 'monthly' | 'yearly' })}
                                >
                                    <option value="weekly">{t('budgets.weekly')}</option>
                                    <option value="monthly">{t('budgets.monthly')}</option>
                                    <option value="yearly">{t('budgets.yearly')}</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setShowModal(false)}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    isLoading={saving}
                                >
                                    {editingBudget ? t('common.save') : t('common.add')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmDelete}
                title={t('common.delete')}
                message={t('common.confirm_delete')}
                isLoading={deleting}
            />
        </div>
    );
}
