'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { categoriesApi } from '@/lib/api';
import { Category } from '@/types/definitions';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';
import {
    Plus,
    X,
    Loader2,
    Pencil,
    Trash2,
    Search
} from 'lucide-react';
import FloatingMenu from '@/components/layout/FloatingMenu';

const ICONS = ['💰', '💵', '💳', '🏦', '💎', '🎁', '🛒', '🍔', '☕', '🚗', '✈️', '🏠', '📱', '💻', '🎬', '🎮', '📚', '💊', '🏥', '👕', '💇', '🎓', '📄', '⚡', '💡'];
const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#eab308', '#ec4899', '#06b6d4', '#ef4444', '#14b8a6', '#6366f1'];

import { useLanguage } from '@/lib/language-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function CategoriesPage() {
    const router = useRouter();
    const { token, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [formData, setFormData] = useState({
        name: '',
        icon: '💰',
        color: '#3b82f6',
        type: 'expense' as 'income' | 'expense',
        is_essential: false,
    });

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        if (token) {
            loadCategories();
        }
    }, [token]);

    const loadCategories = async () => {
        try {
            const cats = await categoriesApi.list();
            setCategories(cats || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingCategory) {
                await categoriesApi.update(editingCategory.id, formData);
            } else {
                await categoriesApi.create(formData);
            }

            setShowModal(false);
            resetForm();
            loadCategories();
            toast.success(t('common.success_save'));
        } catch (error) {
            console.error('Failed to save category:', error);
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
            await categoriesApi.delete(deleteId);
            loadCategories();
            toast.success(t('common.success_delete'));
            setShowConfirm(false);
        } catch (error: any) {
            if (error.response?.status === 400) {
                toast.error(t('categories.cannot_delete_default'));
            } else {
                toast.error(t('common.error_delete'));
            }
        } finally {
            setDeleting(false);
        }
    };
    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            icon: category.icon,
            color: category.color,
            type: category.type,
            is_essential: category.is_essential || false,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            icon: '💰',
            color: '#3b82f6',
            type: activeTab,
            is_essential: false,
        });
    };

    const filteredCategories = categories.filter(c => c.type === activeTab);

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
                        <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
                        <p style={{ color: 'rgb(var(--muted))' }}>{t('categories.subtitle')}</p>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        leftIcon={<Plus size={18} />}
                    >
                        {t('categories.add')}
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['expense', 'income'] as const).map((type) => (
                        <Button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            variant={activeTab === type ? 'primary' : 'secondary'}
                        >
                            {type === 'income' ? t('categories.income') : t('categories.expense')}
                        </Button>
                    ))}
                </div>

                {/* Categories Grid */}
                {filteredCategories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCategories.map((category) => (
                            <Card key={category.id}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                                        style={{ background: `${category.color}20` }}
                                    >
                                        {category.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">{category.name}</h3>
                                        {category.is_default && (
                                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgb(var(--secondary))', color: 'rgb(var(--muted))' }}>
                                                {t('wallets.default_badge')}
                                            </span>
                                        )}
                                    </div>
                                    {!category.is_default && (
                                        <div className="flex gap-1 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditModal(category)}
                                                className="h-8 w-8"
                                            >
                                                <Pencil size={16} style={{ color: 'rgb(var(--muted))' }} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(category.id)}
                                                className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-12">
                        <p style={{ color: 'rgb(var(--muted))' }}>{t('categories.no_categories')} ({activeTab === 'income' ? t('categories.income') : t('categories.expense')})</p>
                    </Card>
                )}
            </main>

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">
                                {editingCategory ? t('categories.edit') : t('categories.add')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Type Toggle */}
                            {!editingCategory && (
                                <div className="flex gap-2">
                                    {(['expense', 'income'] as const).map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type })}
                                            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.type === type
                                                ? type === 'income'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-red-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800'
                                                }`}
                                        >
                                            {type === 'income' ? t('categories.income') : t('categories.expense')}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div>
                                <label className="label">{t('categories.name')}</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder={t('categories.name')}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="label">{t('wallets.icon')}</label>
                                <div className="grid grid-cols-10 gap-2 mb-4">
                                    {ICONS.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon })}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${formData.icon === icon
                                                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <input
                                        type="checkbox"
                                        id="is_essential"
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={formData.is_essential}
                                        onChange={(e) => setFormData({ ...formData, is_essential: e.target.checked })}
                                    />
                                    <div>
                                        <label htmlFor="is_essential" className="text-sm font-medium cursor-pointer block">
                                            Kebutuhan Pokok (Needs)
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            Centang jika ini adalah pengeluaran wajib.
                                        </p>
                                    </div>
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
                                <div className="p-4 rounded-lg flex items-center gap-3" style={{ background: 'rgb(var(--secondary))' }}>
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                        style={{ background: `${formData.color}20` }}
                                    >
                                        {formData.icon}
                                    </div>
                                    <span className="font-medium">{formData.name || t('categories.name')}</span>
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
                                    {editingCategory ? t('common.save') : t('common.add')}
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
