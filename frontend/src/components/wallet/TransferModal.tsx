import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { useLanguage } from '@/lib/language-context';
import { Wallet as WalletType } from '@/types/definitions';
import { transactionsApi } from '@/lib/api';
import { toast } from 'sonner';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    wallets: WalletType[];
}

export default function TransferModal({ isOpen, onClose, onSuccess, wallets }: TransferModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        source_wallet_id: 0,
        target_wallet_id: 0,
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen) {
            // Reset form when opening
            setFormData({
                source_wallet_id: wallets.length > 0 ? wallets[0].id : 0,
                target_wallet_id: wallets.length > 1 ? wallets[1].id : 0,
                amount: 0,
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
        }
    }, [isOpen, wallets]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.source_wallet_id === formData.target_wallet_id) {
            toast.error(t('transactions.transfer_same_wallet_error') || 'Source and target wallets must be different');
            return;
        }

        if (formData.amount <= 0) {
            toast.error(t('common.error_amount') || 'Amount must be greater than 0');
            return;
        }

        setLoading(true);
        try {
            await transactionsApi.transfer(formData);
            toast.success(t('transactions.transfer_success') || 'Transfer successful');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Transfer failed:', error);
            toast.error(t('common.error_save') || 'Failed to process transfer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ArrowRight className="text-blue-600" />
                        {t('transactions.transfer') || 'Transfer Fund'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Source Wallet */}
                    <div>
                        <label className="label">{t('transactions.from_wallet') || 'From Wallet'}</label>
                        <div className="relative">
                            <select
                                className="input pl-10"
                                value={formData.source_wallet_id}
                                onChange={(e) => setFormData({ ...formData, source_wallet_id: Number(e.target.value) })}
                                required
                            >
                                {wallets.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.name} (Saldo: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(w.balance)})
                                    </option>
                                ))}
                            </select>
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                    </div>

                    {/* Arrow Divider */}
                    <div className="flex justify-center -my-1">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-400">
                            <ArrowRight size={16} className="rotate-90" />
                        </div>
                    </div>

                    {/* Target Wallet */}
                    <div>
                        <label className="label">{t('transactions.to_wallet') || 'To Wallet'}</label>
                        <div className="relative">
                            <select
                                className="input pl-10"
                                value={formData.target_wallet_id}
                                onChange={(e) => setFormData({ ...formData, target_wallet_id: Number(e.target.value) })}
                                required
                            >
                                {wallets.map(w => (
                                    <option key={w.id} value={w.id} disabled={w.id === formData.source_wallet_id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="label">{t('common.amount')}</label>
                        <CurrencyInput
                            value={formData.amount}
                            onValueChange={(val) => setFormData({ ...formData, amount: val })}
                            className="input text-lg font-semibold text-blue-600"
                            placeholder="Rp 0"
                        />
                    </div>

                    {/* Date */}
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

                    {/* Description */}
                    <div>
                        <label className="label">{t('common.description')}</label>
                        <textarea
                            className="input min-h-[80px]"
                            placeholder="Catatan transfer..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="secondary"
                            className="flex-1"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            isLoading={loading}
                            leftIcon={<ArrowRight size={18} />}
                        >
                            {t('transactions.transfer_now') || 'Transfer'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
