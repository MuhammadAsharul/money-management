'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { walletsApi } from '@/lib/api';
import { Wallet } from '@/types/definitions';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';
import TransferModal from '@/components/wallet/TransferModal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import FloatingMenu from '@/components/layout/FloatingMenu';
import {
    Plus,
    X,
    Loader2,
    Pencil,
    Trash2,
    Wallet as WalletIcon,
    Check,
    ArrowRightLeft
} from 'lucide-react';

const ICONS = ['💰', '💵', '💳', '🏦', '💎', '🎁', '🛒', '🍔', '☕', '🚗', '✈️', '🏠', '📱', '💻', '🎬', '🎮', '📚', '💊', '🏥', '👕', '💇', '🎓', '📄', '⚡', '💡'];
const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#eab308', '#ec4899', '#06b6d4', '#ef4444', '#14b8a6', '#6366f1'];

import { useLanguage } from '@/lib/language-context';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function WalletsPage() {
    const router = useRouter();
    const { token, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        icon: '💰',
        color: '#3B82F6',
        balance: 0,
        is_default: false,
        description: ''
    });

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        if (token) {
            loadWallets();
        }
    }, [token]);

    const loadWallets = async () => {
        try {
            const data = await walletsApi.list();
            setWallets(data || []);
        } catch (error) {
            console.error('Failed to load wallets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...formData,
                balance: Number(formData.balance)
            };

            if (editingWallet) {
                await walletsApi.update(editingWallet.id, payload);
            } else {
                await walletsApi.create(payload);
            }

            setShowModal(false);
            resetForm();
            loadWallets();
            toast.success(editingWallet ? t('common.success_save') : t('common.success_save'));
        } catch (error) {
            console.error('Failed to save wallet:', error);
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
            await walletsApi.delete(deleteId);
            loadWallets();
            toast.success(t('common.success_delete'));
            setShowConfirm(false);
        } catch (error: any) {
            if (error.response?.status === 400) {
                toast.error(t('wallets.delete_error_last'));
            } else {
                toast.error(t('common.error_delete'));
            }
        } finally {
            setDeleting(false);
        }
    };

    const openEditModal = (wallet: Wallet) => {
        setEditingWallet(wallet);
        setFormData({
            name: wallet.name,
            icon: wallet.icon,
            color: wallet.color,
            balance: Number(wallet.balance),
            is_default: wallet.is_default,
            description: wallet.description || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingWallet(null);
        setFormData({
            name: '',
            icon: '💰',
            color: '#3b82f6',
            balance: 0,
            is_default: false,
            description: '',
        });
    };



    // ... (existing code)

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
                        <h1 className="text-2xl font-bold">{t('wallets.title')}</h1>
                        <p style={{ color: 'rgb(var(--muted))' }}>{t('wallets.subtitle')}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setShowTransferModal(true)}
                            variant="secondary"
                            leftIcon={<ArrowRightLeft size={18} />}
                        >
                            {t('transactions.transfer') || 'Transfer'}
                        </Button>
                        <Button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            leftIcon={<Plus size={18} />}
                        >
                            {t('wallets.add')}
                        </Button>
                    </div>
                </div>

                {/* Wallets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wallets.map((wallet) => (
                        <Card key={wallet.id} className="relative overflow-hidden" noPadding>
                            {/* Background Decoration */}
                            <div
                                className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10"
                                style={{ background: wallet.color }}
                            />

                            <div className="relative p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                                            style={{ background: 'rgb(var(--card))' }}
                                        >
                                            {wallet.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                {wallet.name}
                                                {wallet.is_default && (
                                                    <Badge variant="default">
                                                        {t('wallets.default_badge')}
                                                    </Badge>
                                                )}
                                            </h3>
                                            <p className="text-sm opacity-70">{wallet.description || t('wallets.no_desc')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditModal(wallet)}
                                            className="h-8 w-8"
                                        >
                                            <Pencil size={16} className="text-gray-500" />
                                        </Button>
                                        {!wallet.is_default && wallets.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(wallet.id)}
                                                className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-1">{t('wallets.current_balance')}</p>
                                    <p className="text-2xl font-bold" style={{ color: wallet.color }}>
                                        {formatCurrency(wallet.balance)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">
                                {editingWallet ? t('wallets.edit') : t('wallets.add')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">{t('wallets.name')}</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder={t('wallets.name_placeholder')}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            {!editingWallet && (
                                <div>
                                    <label className="label">{t('wallets.initial_balance')}</label>
                                    <CurrencyInput
                                        value={formData.balance}
                                        onValueChange={(val) => setFormData({ ...formData, balance: val })}
                                        className="input"
                                        placeholder="Rp 0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{t('wallets.initial_balance_desc')}</p>
                                </div>
                            )}

                            <div>
                                <label className="label">{t('common.description')} ({t('wallets.no_desc')})</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder={t('common.description')}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_default}
                                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                                    />
                                    <span className="text-sm font-medium">{t('wallets.is_default')}</span>
                                </label>
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="label">{t('wallets.icon')}</label>
                                <div className="grid grid-cols-10 gap-2">
                                    {ICONS.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon })}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${formData.icon === icon
                                                ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label className="label">{t('wallets.color')}</label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color })}
                                            className={`w-8 h-8 rounded-full transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                                                }`}
                                            style={{ background: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div>
                                <label className="label">{t('wallets.preview')}</label>
                                <div className="p-4 rounded-lg flex items-center gap-3 border" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                                        style={{ background: 'rgb(var(--secondary))' }}
                                    >
                                        {formData.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold" style={{ color: formData.color }}>{formData.name || t('wallets.name')}</h3>
                                        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>{formData.description || t('common.description')}</p>
                                    </div>
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
                                    {editingWallet ? t('common.save') : t('common.add')}
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
                title={t('wallets.delete_title')}
                message={t('wallets.delete_message')}
                isLoading={deleting}
            />

            <TransferModal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                onSuccess={() => { loadWallets(); }}
                wallets={wallets}
            />
        </div>
    );
}
