'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { recurringApi, walletsApi, categoriesApi } from '@/lib/api';
import { RecurringTransaction, Wallet, Category } from '@/types/definitions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import FloatingMenu from '@/components/layout/FloatingMenu';
import {
    Plus,
    Calendar,
    Repeat,
    Trash2,
    X,
    Loader2,
    ArrowRight,
    Wallet as WalletIcon
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { useLanguage } from '@/lib/language-context';

export default function RecurringPage() {
    const router = useRouter();
    const { token, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Delete state
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        description: '',
        amount: 0,
        type: 'expense' as 'income' | 'expense',
        category_id: 0,
        wallet_id: 0,
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        try {
            const [recurringData, walletsData, categoriesData] = await Promise.all([
                recurringApi.list(),
                walletsApi.list(),
                categoriesApi.list()
            ]);
            setRecurrings(recurringData);
            setWallets(walletsData);
            setCategories(categoriesData);

            // Set default wallet
            const defaultWallet = walletsData.find((w: Wallet) => w.is_default);
            if (defaultWallet) {
                setFormData(prev => ({ ...prev, wallet_id: defaultWallet.id }));
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error(t('common.error_save'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Validate inputs
            if (!formData.wallet_id || !formData.category_id || formData.amount <= 0) {
                toast.error(t('common.error_save'));
                setSaving(false);
                return;
            }

            // Check negative amount for expense
            const amount = formData.type === 'expense' ? Math.abs(formData.amount) : Math.abs(formData.amount);

            await recurringApi.create({
                ...formData,
                amount: amount,
                frequency: formData.frequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
                next_run_date: formData.start_date, // initial
                is_active: true
            });

            toast.success(t('common.success_save'));
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Failed to save recurring:', error);
            toast.error(t('common.error_save'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setShowConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await recurringApi.delete(deleteId);
            toast.success(t('common.success_delete'));
            fetchData();
            setShowConfirm(false);
        } catch (error) {
            console.error('Failed to delete:', error);
            toast.error(t('common.error_delete'));
        } finally {
            setDeleting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            description: '',
            amount: 0,
            type: 'expense',
            category_id: categories.length > 0 ? categories[0].id : 0,
            wallet_id: wallets.length > 0 ? wallets[0].id : 0,
            frequency: 'monthly',
            start_date: new Date().toISOString().split('T')[0]
        });
    };

    // Helpers
    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'daily': return t('recurring.daily');
            case 'weekly': return t('recurring.weekly');
            case 'monthly': return t('recurring.monthly');
            case 'yearly': return t('recurring.yearly');
            default: return freq;
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-12 lg:pt-0">
                    <div>
                        <h1 className="text-2xl font-bold">{t('recurring.title')}</h1>
                        <p style={{ color: 'rgb(var(--muted))' }}>{t('recurring.subtitle')}</p>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        leftIcon={<Plus size={18} />}
                    >
                        {t('recurring.add')}
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800">
                        <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">{t('recurring.total_income')}</div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {formatCurrency(recurrings.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0))}
                        </div>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800">
                        <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">{t('recurring.total_expense')}</div>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                            {formatCurrency(recurrings.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0))}
                        </div>
                    </Card>
                    <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('recurring.net_estimated')}</div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {formatCurrency(
                                recurrings.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0) -
                                recurrings.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
                            )}
                        </div>
                    </Card>
                </div>

                {/* List */}
                <Card className="overflow-hidden" noPadding>
                    {recurrings.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 text-left text-sm font-semibold text-gray-500">
                                    <tr>
                                        <th className="p-4">{t('common.description')}</th>
                                        <th className="p-4">{t('recurring.frequency')}</th>
                                        <th className="p-4">{t('common.amount')}</th>
                                        <th className="p-4">{t('categories.title')} & {t('transactions.wallet')}</th>
                                        <th className="p-4">{t('recurring.next_schedule')}</th>
                                        <th className="p-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {recurrings.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium">{item.description}</div>
                                                <div className="text-xs text-gray-400 capitalize">{item.type === 'income' ? t('categories.income') : t('categories.expense')}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    <Repeat size={10} />
                                                    {getFrequencyLabel(item.frequency)}
                                                </span>
                                            </td>
                                            <td className={`p-4 font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.category?.color || '#ccc' }}></span>
                                                    {item.category?.name || 'Kategori ?'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <WalletIcon size={12} />
                                                    {item.wallet?.name || 'Dompet ?'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm">
                                                <div className="flex items-center gap-1.5 ">
                                                    <Calendar size={14} className="text-orange-500" />
                                                    {formatDate(item.next_run_date)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(item.id)}
                                                    className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 size={16} className="text-red-500" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Repeat size={48} className="mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-medium mb-1">{t('recurring.no_recurring')}</h3>
                            <p className="text-sm mb-6 max-w-sm mx-auto">
                                {t('recurring.no_recurring_desc')}
                            </p>
                            <Button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                variant="secondary"
                            >
                                {t('recurring.create_now')}
                            </Button>
                        </div>
                    )}
                </Card>
            </main>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">{t('recurring.add')}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Type Selector */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                                    className={`justify-center ${formData.type === 'expense'
                                        ? 'bg-red-100 text-red-600 hover:bg-red-200 border-red-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-transparent'
                                        }`}
                                    variant="ghost"
                                >
                                    {t('categories.expense')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'income' })}
                                    className={`justify-center ${formData.type === 'income'
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200 border-green-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-transparent'
                                        }`}
                                    variant="ghost"
                                >
                                    {t('categories.income')}
                                </Button>
                            </div>

                            <div>
                                <label className="label">{t('common.amount')}</label>
                                <CurrencyInput
                                    value={formData.amount}
                                    onValueChange={(val) => setFormData({ ...formData, amount: val })}
                                    className="input"
                                    placeholder="Rp 0"
                                />
                            </div>

                            <div>
                                <label className="label">{t('common.description')}</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder={formData.type === 'expense' ? 'Contoh: Netflix, Spotify' : 'Contoh: Gaji Bulanan'}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('categories.title')}</label>
                                    <select
                                        className="input"
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                                        required
                                    >
                                        <option value={0}>{t('transactions.select_category')}</option>
                                        {categories
                                            .filter(c => c.type === formData.type)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div>
                                    <label className="label">{t('transactions.wallet')}</label>
                                    <select
                                        className="input"
                                        value={formData.wallet_id}
                                        onChange={(e) => setFormData({ ...formData, wallet_id: Number(e.target.value) })}
                                        required
                                    >
                                        <option value={0}>{t('transactions.wallet')}</option>
                                        {wallets.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('recurring.frequency')}</label>
                                    <select
                                        className="input"
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="daily">{t('recurring.daily')}</option>
                                        <option value="weekly">{t('recurring.weekly')}</option>
                                        <option value="monthly">{t('recurring.monthly')}</option>
                                        <option value="yearly">{t('recurring.yearly')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">{t('recurring.start_date')}</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    isLoading={saving}
                                    leftIcon={<Plus size={18} />}
                                >
                                    {t('common.save')}
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
