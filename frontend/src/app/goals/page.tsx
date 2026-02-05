'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { goalsApi } from '@/lib/api';
import { Goal, GoalTransaction } from '@/types/definitions';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import FloatingMenu from '@/components/layout/FloatingMenu';
import {
    Plus,
    Target,
    Pencil,
    Trash2,
    X,
    Loader2,
    TrendingUp,
    UserPlus,
    Users,
    History,
    Calendar,
    Clock,
    ShoppingCart
} from 'lucide-react';
import ShoppingListModal from '@/components/goals/ShoppingListModal';

import { useLanguage } from '@/lib/language-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function GoalsPage() {
    const router = useRouter();
    const { token, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [saving, setSaving] = useState(false);

    // Add Savings Modal State
    const [showAddSavingsModal, setShowAddSavingsModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [addAmount, setAddAmount] = useState(0);
    const [addNotes, setAddNotes] = useState('');
    const [addDate, setAddDate] = useState('');

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [goalHistory, setGoalHistory] = useState<GoalTransaction[]>([]);

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    // Shopping List Modal State
    const [showShoppingListModal, setShowShoppingListModal] = useState(false);
    const [selectedGoalForList, setSelectedGoalForList] = useState<Goal | null>(null);

    // Delete state
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        target_amount: 0,
        current_amount: 0,
        deadline: '',
        icon: '🎯',
        color: '#10B981',
        description: ''
    });

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        if (token) {
            loadGoals();
        }
    }, [token]);

    const loadGoals = async () => {
        try {
            const data = await goalsApi.list();
            setGoals(data);
        } catch (error) {
            console.error('Failed to load goals:', error);
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
                target_amount: Number(formData.target_amount),
                current_amount: Number(formData.current_amount)
            };

            if (editingGoal) {
                await goalsApi.update(editingGoal.id, payload);
                toast.success(t('common.success_save'));
            } else {
                await goalsApi.create(payload);
                toast.success(t('common.success_save'));
            }

            setShowModal(false);
            resetForm();
            loadGoals();
        } catch (error) {
            console.error('Failed to save goal:', error);
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
            await goalsApi.delete(deleteId);
            loadGoals();
            toast.success(t('common.success_delete'));
            setShowConfirm(false);
        } catch (error) {
            console.error('Failed to delete goal:', error);
            toast.error(t('common.error_delete'));
        } finally {
            setDeleting(false);
        }
    };

    const openEditModal = (goal: Goal) => {
        setEditingGoal(goal);
        setFormData({
            name: goal.name,
            target_amount: goal.target_amount,
            current_amount: goal.current_amount,
            deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
            icon: goal.icon,
            color: goal.color,
            description: goal.description || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingGoal(null);
        setFormData({
            name: '',
            target_amount: 0,
            current_amount: 0,
            deadline: '',
            icon: '🎯',
            color: '#10B981',
            description: ''
        });
    };

    const openAddSavingsModal = (goal: Goal) => {
        setSelectedGoal(goal);
        setAddAmount(0);
        setAddNotes('');
        setAddDate(new Date().toISOString().split('T')[0]);
        setShowAddSavingsModal(true);
    };

    const openHistoryModal = async (goal: Goal) => {
        setSelectedGoal(goal);
        setGoalHistory([]);
        setShowHistoryModal(true);
        try {
            const history = await goalsApi.getHistory(goal.id);
            setGoalHistory(history);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const handleAddSavings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoal) return;
        setSaving(true);
        try {
            await goalsApi.addFunds(selectedGoal.id, addAmount, addNotes, addDate);
            toast.success(`${t('goals.saved_success')} ${formatCurrency(addAmount)}!`);
            setShowAddSavingsModal(false);
            loadGoals();
        } catch (error) {
            console.error('Failed to add savings:', error);
            toast.error(t('common.error_save'));
        } finally {
            setSaving(false);
        }
    };

    const openInviteModal = (goal: Goal) => {
        setSelectedGoal(goal);
        setInviteEmail('');
        setShowInviteModal(true);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoal) return;
        setSaving(true);
        try {
            await goalsApi.addMember(selectedGoal.id, inviteEmail);
            toast.success(t('goals.invite_success') + ' ' + inviteEmail);
            setShowInviteModal(false);
            loadGoals(); // Reload to see if immediate update or valid check
        } catch (error) {
            console.error('Failed to invite member:', error);
            toast.error(t('common.error_save'));
        } finally {
            setSaving(false);
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
                        <h1 className="text-2xl font-bold">{t('goals.title')}</h1>
                        <p style={{ color: 'rgb(var(--muted))' }}>{t('goals.subtitle')}</p>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        leftIcon={<Plus size={18} />}
                    >
                        {t('goals.add')}
                    </Button>
                </div>

                {/* Goals Grid */}
                {goals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {goals.map((goal) => {
                            const progress = (goal.current_amount / goal.target_amount) * 100;
                            const isCompleted = progress >= 100;
                            const remaining = Math.max(0, goal.target_amount - goal.current_amount);

                            return (
                                <Card key={goal.id} className="relative overflow-hidden group">
                                    {/* Progress Background Overlay */}
                                    <div
                                        className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-1000"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    ></div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm relative"
                                                style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                                            >
                                                {goal.icon}
                                                {/* Shared Badge */}
                                                {(goal.members && goal.members.length > 0) && (
                                                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1 rounded-full shadow-sm" title="Tabungan Bersama">
                                                        <Users size={12} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg flex items-center gap-2">
                                                    {goal.name}
                                                </h3>
                                                {goal.deadline && (
                                                    <p className="text-xs text-gray-500">
                                                        {t('goals.deadline')}: {formatDate(goal.deadline)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openInviteModal(goal)}
                                                className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500"
                                                title={t('goals.invite')}
                                            >
                                                <UserPlus size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openHistoryModal(goal)}
                                                className="h-8 w-8 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-500"
                                                title={t('goals.history')}
                                            >
                                                <History size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedGoalForList(goal);
                                                    setShowShoppingListModal(true);
                                                }}
                                                className="h-8 w-8 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-pink-500"
                                                title={t('goals.shopping_list')}
                                            >
                                                <ShoppingCart size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditModal(goal)}
                                                className="h-8 w-8"
                                            >
                                                <Pencil size={16} className="text-gray-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(goal.id)}
                                                className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-500">{t('goals.achieved')}</span>
                                                <span className="font-bold text-green-600">{formatPercentage(progress)}</span>
                                            </div>
                                            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                <p className="text-xs text-gray-500 mb-1">{t('goals.collected')}</p>
                                                <p className="font-semibold text-green-600 truncate">{formatCurrency(goal.current_amount)}</p>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                <p className="text-xs text-gray-500 mb-1">{t('goals.remaining')}</p>
                                                <p className="font-semibold text-orange-600 truncate">{formatCurrency(remaining)}</p>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => openAddSavingsModal(goal)}
                                            className="w-full shadow-lg shadow-primary/20 hover:shadow-primary/40"
                                            leftIcon={<Plus size={18} />}
                                        >
                                            {t('goals.add_savings')}
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                            <Target size={32} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">{t('goals.no_goals')}</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            {t('goals.no_goals_desc')}
                        </p>
                        <Button onClick={() => { resetForm(); setShowModal(true); }}>
                            {t('goals.add')}
                        </Button>
                    </Card>
                )}
            </main>

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">
                                {editingGoal ? t('goals.edit') : t('goals.add')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">{t('goals.name')}</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Contoh: Beli HP Baru"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('wallets.icon')}</label>
                                    <input
                                        type="text"
                                        className="input text-center"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        placeholder="🔍"
                                        maxLength={2}
                                    />
                                </div>
                                <div>
                                    <label className="label">{t('wallets.color')}</label>
                                    <div className="flex gap-2 mt-2">
                                        {['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'].map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color: c })}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${formData.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="label">{t('goals.target_amount')}</label>
                                <CurrencyInput
                                    value={formData.target_amount}
                                    onValueChange={(val) => setFormData({ ...formData, target_amount: val })}
                                    className="input"
                                    placeholder="Rp 0"
                                />
                            </div>

                            <div>
                                <label className="label">{t('goals.current_amount')}</label>
                                <CurrencyInput
                                    value={formData.current_amount}
                                    onValueChange={(val) => setFormData({ ...formData, current_amount: val })}
                                    className="input"
                                    placeholder="Rp 0"
                                />
                            </div>

                            <div>
                                <label className="label">{t('goals.deadline')} (Optional)</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">{t('common.description')}</label>
                                <textarea
                                    className="input"
                                    rows={2}
                                    placeholder={t('common.description')}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
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
                                    {editingGoal ? t('common.save') : t('goals.add')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Savings Modal */}
            {showAddSavingsModal && selectedGoal && (
                <div className="modal-backdrop" onClick={() => setShowAddSavingsModal(false)}>
                    <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">{t('goals.add_savings')}</h2>
                            <button onClick={() => setShowAddSavingsModal(false)} className="p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-3">
                                {selectedGoal.icon}
                            </div>
                            <h3 className="font-bold">{selectedGoal.name}</h3>
                            <p className="text-sm text-gray-500">{t('goals.target_amount')}: {formatCurrency(selectedGoal.target_amount)}</p>
                        </div>

                        <form onSubmit={handleAddSavings} className="space-y-4">
                            <div>
                                <label className="label text-center">{t('common.amount')}</label>
                                <CurrencyInput
                                    value={addAmount}
                                    onValueChange={setAddAmount}
                                    className="input text-center text-xl font-bold py-3"
                                    placeholder="Rp 0"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('common.date')}</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={addDate}
                                        onChange={(e) => setAddDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">{t('common.notes')}</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder={t('common.notes')}
                                        value={addNotes}
                                        onChange={(e) => setAddNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-3 text-lg"
                                isLoading={saving}
                                leftIcon={<Plus size={20} />}
                            >
                                {t('common.save')}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && selectedGoal && (
                <div className="modal-backdrop" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">{t('goals.history')}</h2>
                                    <p className="text-xs text-gray-500">{selectedGoal.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {goalHistory.length > 0 ? (
                                <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-6 py-2">
                                    {goalHistory.map((tx) => (
                                        <div key={tx.id} className="relative pl-6">
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-white dark:border-slate-900"></div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        +{formatCurrency(tx.amount)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                        <Calendar size={10} /> {formatDate(tx.date)}
                                                        {tx.user && (
                                                            <span className="flex items-center gap-1 ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                                {tx.user.name.split(' ')[0]}
                                                            </span>
                                                        )}
                                                    </p>
                                                    {tx.notes && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                                                            "{tx.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Clock size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>Belum ada riwayat menabung.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && selectedGoal && (
                <div className="modal-backdrop" onClick={() => setShowInviteModal(false)}>
                    <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">{t('goals.invite')}</h2>
                            <button onClick={() => setShowInviteModal(false)} className="p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-2">Ajak teman menabung bersama untuk target:</p>
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                <span className="text-2xl">{selectedGoal.icon}</span>
                                <span className="font-bold">{selectedGoal.name}</span>
                            </div>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="label">Email Teman</label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="nama@email.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={saving}
                                leftIcon={<UserPlus size={18} />}
                            >
                                {t('goals.invite')}
                            </Button>
                        </form>

                        {/* Member List Preview */}
                        {selectedGoal.members && selectedGoal.members.length > 0 && (
                            <div className="mt-6 pt-6 border-t dark:border-gray-800">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Member Saat Ini</h4>
                                <div className="space-y-2">
                                    {selectedGoal.members.map((m) => (
                                        <div key={m.user_id} className="flex items-center gap-2 text-sm">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                {m.user?.name ? m.user.name[0] : 'U'}
                                            </div>
                                            <span>{m.user?.name || 'User'}</span>
                                            {m.role === 'owner' && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Owner</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Shopping List Modal */}
            {showShoppingListModal && selectedGoalForList && (
                <ShoppingListModal
                    isOpen={showShoppingListModal}
                    onClose={() => setShowShoppingListModal(false)}
                    goal={selectedGoalForList}
                    onUpdate={loadGoals}
                />
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
