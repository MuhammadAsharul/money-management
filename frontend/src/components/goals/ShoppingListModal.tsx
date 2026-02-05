'use client';

import { useState, useEffect } from 'react';
import { Goal, GoalItem } from '@/types/definitions';
import { goalsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Trash2, Check, X, ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import CurrencyInput from '@/components/ui/CurrencyInput';

interface ShoppingListModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal;
    onUpdate: () => void;
}

export default function ShoppingListModal({ isOpen, onClose, goal, onUpdate }: ShoppingListModalProps) {
    const [items, setItems] = useState<GoalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        estimated_price: 0,
        note: ''
    });
    const [adding, setAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'purchased'>('pending');

    const [confirmPurchaseItem, setConfirmPurchaseItem] = useState<GoalItem | null>(null);
    const [confirmPrice, setConfirmPrice] = useState(0);
    const [confirmDeleteItem, setConfirmDeleteItem] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && goal.id) {
            loadItems();
        }
    }, [isOpen, goal.id]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await goalsApi.getItems(goal.id);
            setItems(data);
        } catch (error) {
            console.error('Failed to load items:', error);
            toast.error('Gagal memuat daftar belanja');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            await goalsApi.addItem(goal.id, {
                ...formData,
                estimated_price: Number(formData.estimated_price)
            });
            toast.success('Item berhasil ditambahkan');
            setFormData({ name: '', estimated_price: 0, note: '' });
            loadItems();
            onUpdate(); // Trigger parent update if needed
        } catch (error) {
            console.error('Failed to add item:', error);
            toast.error('Gagal menambahkan item');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: number) => {
        setConfirmDeleteItem(id);
    };

    const handleConfirmDelete = async () => {
        if (!confirmDeleteItem) return;
        try {
            await goalsApi.deleteItem(confirmDeleteItem);
            toast.success('Item dihapus');
            loadItems();
            onUpdate();
            setConfirmDeleteItem(null);
        } catch (error) {
            console.error('Failed to delete item:', error);
            toast.error('Gagal menghapus item');
        }
    };

    const handleTogglePurchased = async (item: GoalItem) => {
        if (!item.is_purchased) {
            // Open confirmation modal
            setConfirmPurchaseItem(item);
            setConfirmPrice(item.estimated_price); // Default to estimate
            return;
        }

        // Check if unchecking
        try {
            await goalsApi.updateItem(item.id, {
                ...item,
                is_purchased: false,
                actual_price: 0
            });
            loadItems();
            onUpdate();
        } catch (error) {
            console.error('Failed to update item:', error);
            toast.error('Gagal mengupdate item');
        }
    };

    const handleConfirmPurchase = async () => {
        if (!confirmPurchaseItem) return;

        try {
            await goalsApi.updateItem(confirmPurchaseItem.id, {
                ...confirmPurchaseItem,
                is_purchased: true,
                actual_price: confirmPrice
            });
            toast.success('Item ditandai sudah dibeli');
            loadItems();
            onUpdate();
            setConfirmPurchaseItem(null);
        } catch (error) {
            console.error('Failed to update item:', error);
            toast.error('Gagal mengupdate item');
        }
    };

    if (!isOpen) return null;

    const pendingItems = items.filter(i => !i.is_purchased);
    const purchasedItems = items.filter(i => i.is_purchased);
    const totalEstimated = items.reduce((sum, i) => sum + i.estimated_price, 0);
    const totalActual = items.reduce((sum, i) => sum + (i.is_purchased ? i.actual_price : 0), 0);

    const displayItems = activeTab === 'pending' ? pendingItems : purchasedItems;

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
                                <ShoppingCart size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Daftar Belanja: {goal.name}</h2>
                                <p className="text-sm text-gray-500">Estimasi Total: {formatCurrency(totalEstimated)}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Add New Item */}
                    <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-5">
                                <label className="text-xs font-medium mb-1 block">Nama Barang</label>
                                <input
                                    type="text"
                                    className="input py-2 text-sm"
                                    placeholder="Cincin, Catering, dll..."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="md:col-span-4">
                                <label className="text-xs font-medium mb-1 block">Estimasi Harga</label>
                                <CurrencyInput
                                    value={formData.estimated_price}
                                    onValueChange={(val) => setFormData({ ...formData, estimated_price: val })}
                                    className="input py-2 text-sm"
                                    placeholder="Rp 0"
                                    required
                                />
                            </div>
                            <div className="md:col-span-3">
                                <Button
                                    type="submit"
                                    className="w-full py-2 text-sm"
                                    isLoading={adding}
                                    leftIcon={<Plus size={16} />}
                                >
                                    Tambah
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-slate-700 mb-4 gap-4">
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending'
                                ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            onClick={() => setActiveTab('pending')}
                        >
                            Belum Dibeli ({pendingItems.length})
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'purchased'
                                ? 'border-green-500 text-green-600 dark:text-green-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            onClick={() => setActiveTab('purchased')}
                        >
                            Sudah Dibeli ({purchasedItems.length})
                        </button>
                    </div>

                    {/* List */}
                    <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
                        ) : displayItems.length > 0 ? (
                            <div className="space-y-2">
                                {displayItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleTogglePurchased(item)}
                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.is_purchased
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-gray-300 hover:border-green-500 text-transparent hover:text-green-500'
                                                    }`}
                                            >
                                                <Check size={12} />
                                            </button>
                                            <div>
                                                <div className={`font-medium ${item.is_purchased ? 'line-through text-gray-400' : ''}`}>
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Est: {formatCurrency(item.estimated_price)}
                                                    {item.is_purchased && (
                                                        <span className="ml-2 font-medium text-green-600">
                                                            (Beli: {formatCurrency(item.actual_price)})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(item.id)}
                                                className="h-7 w-7 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-sm">Belum ada item di list ini.</p>
                            </div>
                        )}
                    </div>

                    {
                        activeTab === 'purchased' && purchasedItems.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-sm">
                                <span className="text-gray-500">Total Pengeluaran Real:</span>
                                <span className="font-bold text-lg">{formatCurrency(totalActual)}</span>
                            </div>
                        )
                    }
                </div >
            </div >

            {/* Confirm Purchase Modal */}
            {confirmPurchaseItem && (
                <div role="dialog" className="modal-backdrop z-50">
                    <div className="modal-content max-w-sm">
                        <h3 className="text-lg font-semibold mb-2">Konfirmasi Harga Beli</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Masukkan harga sebenarnya untuk <b>{confirmPurchaseItem.name}</b>.
                        </p>
                        <div className="mb-4">
                            <label className="text-xs font-medium mb-1 block">Harga Beli</label>
                            <CurrencyInput
                                value={confirmPrice}
                                onValueChange={setConfirmPrice}
                                className="input py-2"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setConfirmPurchaseItem(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleConfirmPurchase}
                            >
                                Simpan
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {confirmDeleteItem && (
                <div role="dialog" className="modal-backdrop z-50">
                    <div className="modal-content max-w-sm">
                        <h3 className="text-lg font-semibold mb-2">Hapus Item?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Apakah Anda yakin ingin menghapus item ini dari daftar belanja?
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setConfirmDeleteItem(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleConfirmDelete}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                Hapus
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
