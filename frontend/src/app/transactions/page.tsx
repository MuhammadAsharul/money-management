'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { transactionsApi, categoriesApi, walletsApi, uploadApi } from '@/lib/api';
import { Transaction, Category, Wallet } from '@/types/definitions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import FloatingMenu from '@/components/layout/FloatingMenu';

import {
    Plus,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    X,
    Loader2,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Download,
    Calendar,
    Tags,
    ImagePlus,
    Eye
} from 'lucide-react';

import { useLanguage } from '@/lib/language-context';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function TransactionsPage() {
    const router = useRouter();
    const { token, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [filterCategory, setFilterCategory] = useState<number>(0);
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [formData, setFormData] = useState({
        category_id: 0,
        wallet_id: 0,
        amount: 0,
        date: formatDate(new Date()),
        description: '',
        type: 'expense' as 'income' | 'expense',
        notes: '',
        proof_url: '',
    });
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string>('');

    const limit = 10;

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        if (token) {
            loadData();
        }
    }, [token, page, search, filterType, dateRange, filterCategory]); // Reload on filter change

    const loadData = async () => {
        try {
            const filters = {
                search,
                type: filterType !== 'all' ? filterType : undefined,
                start_date: dateRange.start || undefined,
                end_date: dateRange.end || undefined,
                category_id: filterCategory || undefined
            };

            const [txResponse, cats, walletList] = await Promise.all([
                transactionsApi.list(page, limit, filters),
                categoriesApi.list(),
                walletsApi.list(),
            ]);
            setTransactions(txResponse.transactions || []);
            setTotal(txResponse.total); setCategories(cats || []); setWallets(walletList || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Upload proof if file selected
            let proofUrl = formData.proof_url;
            if (proofFile) {
                const uploadResult = await uploadApi.upload(proofFile);
                proofUrl = uploadResult.url;
            }

            const payload = {
                ...formData,
                proof_url: proofUrl,
                amount: Number(formData.amount),
                date: new Date(formData.date).toISOString()
            };

            if (editingTransaction) {
                await transactionsApi.update(editingTransaction.id, payload);
            } else {
                await transactionsApi.create(payload);
            }

            setShowModal(false);
            resetForm();
            loadData();
            toast.success(t('common.success_save'));
        } catch (error) {
            console.error('Failed to save transaction:', error);
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
            await transactionsApi.delete(deleteId);
            loadData();
            toast.success(t('common.success_delete'));
            setShowConfirm(false);
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            toast.error(t('common.error_delete'));
        } finally {
            setDeleting(false);
        }
    };

    const openEditModal = (tx: Transaction) => {
        setEditingTransaction(tx);
        setFormData({
            category_id: tx.category_id,
            wallet_id: tx.wallet_id || 0,
            amount: Number(tx.amount),
            type: tx.type,
            description: tx.description,
            date: new Date(tx.date).toISOString().split('T')[0],
            notes: tx.notes || '',
            proof_url: tx.proof_url || '',
        });
        setProofPreview(tx.proof_url ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${tx.proof_url}` : '');
        setProofFile(null);
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingTransaction(null);
        setFormData({
            category_id: 0,
            wallet_id: 0,
            amount: 0,
            type: 'expense',
            description: '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
            proof_url: '',
        });
        setProofFile(null);
        setProofPreview('');
    };

    // const filteredTransactions = transactions; // Now serverside filtered
    // Clientside not needed anymore
    // Allow "Transfer" category to be shown regardless of transaction type
    const filteredCategories = categories.filter(c => c.type === formData.type || c.name.toLowerCase() === 'transfer');
    const totalPages = Math.ceil(total / limit);

    const handleExport = async () => {
        try {
            toast.loading(t('common.loading'));
            const filters = {
                search,
                type: filterType !== 'all' ? filterType : undefined,
                start_date: dateRange.start || undefined,
                end_date: dateRange.end || undefined,
                category_id: filterCategory || undefined
            };
            const response = await transactionsApi.list(1, 1000, filters);
            const data = response.transactions || [];

            // Convert to CSV
            const headers = [t('common.date'), t('common.description'), 'Type', 'Category', t('common.amount'), 'Wallet', t('common.notes')];
            const csvRows = [headers.join(',')];

            for (const row of data) {
                const values = [
                    new Date(row.date).toISOString().split('T')[0],
                    `"${row.description?.replace(/"/g, '""') || ''}"`,
                    row.type === 'income' ? t('dashboard.income') : t('dashboard.expense'),
                    row.category?.name || 'Uncategorized',
                    row.amount,
                    row.wallet?.name || '-',
                    `"${row.notes?.replace(/"/g, '""') || ''}"`
                ];
                csvRows.push(values.join(','));
            }

            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success(t('transactions.export_success'));
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export data');
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
                        <h1 className="text-2xl font-bold">{t('transactions.title')}</h1>
                        <p style={{ color: 'rgb(var(--muted))' }}>{t('transactions.subtitle')}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/categories')}
                            leftIcon={<Tags size={18} />}
                        >
                            <span className="hidden md:inline">{t('sidebar.categories')}</span>
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleExport}
                            leftIcon={<Download size={18} />}
                        >
                            <span className="hidden md:inline">{t('common.export')}</span>
                        </Button>
                        <Button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            leftIcon={<Plus size={18} />}
                        >
                            {t('common.add')}
                        </Button>
                    </div>
                </div>

                <Card className="mb-6 p-5">
                    <div className="space-y-5">
                        {/* Top: Search & Tabs */}
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            {/* Search */}
                            <div className="relative flex-1 group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-orange-500 text-gray-400">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    className="input pl-10 w-full bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 transition-all"
                                    placeholder={t('transactions.search_placeholder')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Tabs */}
                            <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-lg self-start shrink-0">
                                {(['all', 'income', 'expense'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filterType === type
                                            ? 'bg-white dark:bg-slate-800 shadow-sm text-gray-900 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {type === 'all' ? t('transactions.all') : type === 'income' ? t('dashboard.income') : t('dashboard.expense')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bottom: Date & Category Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                            {/* Date Range */}
                            <div className="md:col-span-6 flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">{t('transactions.date_range')}</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="date"
                                            className="input pl-9 py-2 text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        />
                                    </div>
                                    <span className="text-gray-300">-</span>
                                    <div className="relative flex-1">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="date"
                                            className="input pl-9 py-2 text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Category Dropdown */}
                            <div className="md:col-span-6 flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">{t('sidebar.categories')}</label>
                                <select
                                    className="input py-2 text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(Number(e.target.value))}
                                >
                                    <option value={0}>{t('transactions.select_category')}</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Reset Button */}
                            <div className="md:col-span-3 flex items-center h-full pb-0.5">
                                {(dateRange.start || dateRange.end || filterCategory !== 0 || search || filterType !== 'all') && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setDateRange({ start: '', end: '' });
                                            setFilterCategory(0);
                                            setFilterType('all');
                                            setSearch('');
                                        }}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                                        {t('transactions.reset_filter')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Transaction List */}
                <Card noPadding>
                    {transactions.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <span className="text-2xl shrink-0">{tx.category?.icon || '💰'}</span>
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{tx.description || tx.category?.name}</p>
                                            <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: 'rgb(var(--muted))' }}>
                                                <span className="shrink-0">{formatDate(tx.date)}</span>
                                                <span className="hidden sm:inline">•</span>
                                                <Badge
                                                    variant={tx.type === 'income' ? 'success' : 'danger'}
                                                    className="hidden sm:inline-flex"
                                                >
                                                    {tx.type === 'income' ? t('dashboard.income') : t('dashboard.expense')}
                                                </Badge>
                                                {tx.wallet && (
                                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 truncate max-w-[100px]">
                                                        {tx.wallet.icon} {tx.wallet.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-right">
                                            {tx.category?.name?.toLowerCase().includes('transfer') ? (
                                                <>
                                                    <ArrowUpRight size={16} className="text-blue-500" />
                                                    <span className="font-semibold text-blue-500">
                                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                    </span>
                                                </>
                                            ) : tx.type === 'income' ? (
                                                <>
                                                    <ArrowUpRight size={16} style={{ color: 'rgb(var(--accent))' }} />
                                                    <span className="font-semibold text-green-500">
                                                        +{formatCurrency(tx.amount)}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowDownRight size={16} style={{ color: 'rgb(var(--danger))' }} />
                                                    <span className="font-semibold text-red-500">
                                                        -{formatCurrency(tx.amount)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditModal(tx)}
                                                className="h-8 w-8"
                                            >
                                                <Pencil size={16} style={{ color: 'rgb(var(--muted))' }} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(tx.id)}
                                                className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12" style={{ color: 'rgb(var(--muted))' }}>
                            {search || filterType !== 'all' ? t('transactions.no_match') : t('dashboard.no_transactions')}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft size={18} />
                            </Button>
                            <span className="px-4 text-sm font-medium" style={{ color: 'rgb(var(--muted))' }}>
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <ChevronRight size={18} />
                            </Button>
                        </div>
                    )}
                </Card>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">
                                {editingTransaction ? t('common.edit') : t('common.add')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Type Toggle */}
                            <div className="flex gap-2">
                                {(['expense', 'income'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type, category_id: 0 })}
                                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.type === type
                                            ? type === 'income'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-red-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800'
                                            }`}
                                    >
                                        {type === 'income' ? t('dashboard.income') : t('dashboard.expense')}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="label">{t('transactions.wallet')}</label>
                                <select
                                    className="input"
                                    value={formData.wallet_id}
                                    onChange={(e) => setFormData({ ...formData, wallet_id: parseInt(e.target.value) })}
                                    required
                                >
                                    <option value={0}>{t('transactions.wallet_default')}</option>
                                    {wallets.map((wallet) => (
                                        <option key={wallet.id} value={wallet.id}>
                                            {wallet.icon} {wallet.name} ({formatCurrency(wallet.balance)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">{t('sidebar.categories')}</label>
                                <select
                                    className="input"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                                    required
                                >
                                    <option value={0}>{t('transactions.select_category')}</option>
                                    {filteredCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.name}
                                        </option>
                                    ))}
                                </select>
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
                                    placeholder={t('common.description')}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">{t('common.date')}</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">{t('common.notes')}</label>
                                <textarea
                                    className="input"
                                    rows={2}
                                    placeholder={t('common.notes')}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            {/* Proof Upload - Optional */}
                            <div>
                                <label className="label">Bukti Transaksi (Opsional)</label>
                                <div className="flex flex-col gap-2">
                                    {/* Preview */}
                                    {(proofPreview || formData.proof_url) && (
                                        <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                            <img
                                                src={proofPreview || `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${formData.proof_url}`}
                                                alt="Preview bukti"
                                                className="w-full h-full object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProofFile(null);
                                                    setProofPreview('');
                                                    setFormData({ ...formData, proof_url: '' });
                                                }}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                        <ImagePlus size={18} />
                                        <span className="text-sm">
                                            {proofPreview || formData.proof_url ? 'Ganti Bukti' : 'Pilih Gambar'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/gif,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setProofFile(file);
                                                    setProofPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
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
                                    {editingTransaction ? t('common.save') : t('common.add')}
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
