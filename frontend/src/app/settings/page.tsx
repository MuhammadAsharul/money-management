'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { authApi, dataApi } from '@/lib/api';
import FloatingMenu from '@/components/layout/FloatingMenu';
import { Loader2, User, Lock, Moon, Sun, Shield, LogOut, Database, Save, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { useLanguage } from '@/lib/language-context';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
    const router = useRouter();
    const { user, token, logout, login } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'data'>('profile');

    // Profile Form
    const [profileForm, setProfileForm] = useState({
        name: '',
        avatar_url: ''
    });

    // Password Form
    const [passwordForm, setPasswordForm] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name,
                avatar_url: user.avatar_url || ''
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authApi.updateProfile(profileForm.name, profileForm.avatar_url);
            toast.success(t('settings.profile_success'));
            // Force reload to update context (or we could update context manually if exposed)
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error(t('common.error_save'));
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.error(t('settings.password_mismatch'));
            return;
        }

        setLoading(true);
        try {
            await authApi.changePassword(passwordForm.old_password, passwordForm.new_password);
            toast.success(t('settings.password_success'));
            logout();
        } catch (error) {
            console.error(error);
            toast.error(t('settings.password_success'));
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            toast.loading(t('common.loading') || 'Downloading...');
            const blob = await dataApi.export();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `money-tracker-backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.dismiss();
            toast.success(t('settings.download_backup'));
        } catch (error) {
            console.error('Backup failed:', error);
            toast.dismiss();
            toast.error(t('common.error_save'));
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm(t('settings.restore_confirm') || 'Are you sure? This will DELETE all current data and replace it with the backup. This cannot be undone.')) {
            e.target.value = ''; // Reset input
            return;
        }

        setLoading(true);
        try {
            toast.loading(t('common.loading') || 'Restoring...');
            await dataApi.import(file);
            toast.dismiss();
            toast.success(t('settings.restore_success') || 'Data restored successfully! reloading...');

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Restore failed:', error);
            toast.dismiss();
            toast.error(t('common.error_save') || 'Restore failed');
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset input
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen pb-24">
            <FloatingMenu />

            <main className="max-w-md mx-auto p-4 md:max-w-2xl lg:max-w-4xl">
                <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

                <Card className="max-w-4xl mx-auto min-h-[500px] flex flex-col md:flex-row overflow-hidden" noPadding>
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 bg-gray-50 dark:bg-slate-800/50 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${activeTab === 'profile'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <User size={18} />
                            {t('settings.profile')}
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${activeTab === 'security'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Shield size={18} />
                            {t('settings.security')}
                        </button>
                        <button
                            onClick={() => setActiveTab('data')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${activeTab === 'data'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Database size={18} />
                            {t('settings.data')}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 md:p-8">
                        {activeTab === 'profile' && (
                            <div className="space-y-6 max-w-md animate-fade-in">
                                <div>
                                    <h2 className="text-lg font-bold mb-1">{t('settings.profile')}</h2>
                                    <p className="text-sm text-gray-500">{t('settings.profile_desc')}</p>
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="flex justify-center mb-6">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-4xl font-bold overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg">
                                                {profileForm.avatar_url ? (
                                                    <img src={profileForm.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    profileForm.name[0]
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">{t('wallets.name')} (Full)</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Avatar URL (Optional)</label>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://..."
                                            value={profileForm.avatar_url}
                                            onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Email</label>
                                        <input
                                            type="email"
                                            className="input bg-gray-50 dark:bg-slate-800/50 text-gray-500 cursor-not-allowed"
                                            value={user.email}
                                            disabled
                                        />
                                    </div>

                                    <Button type="submit" className="w-full" isLoading={loading} leftIcon={<Save size={18} />}>
                                        {t('settings.update_profile')}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 max-w-md animate-fade-in">
                                <div>
                                    <h2 className="text-lg font-bold mb-1">{t('settings.security')}</h2>
                                    <p className="text-sm text-gray-500">{t('settings.security_desc')}</p>
                                </div>

                                {user.provider === 'google' ? (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-4 rounded-xl flex items-start gap-3">
                                        <Shield size={20} className="shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-semibold mb-1">{t('settings.google_login')}</p>
                                            <p>{t('settings.google_login_desc')}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        <div>
                                            <label className="label">{t('settings.old_password')}</label>
                                            <div className="relative">
                                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="password"
                                                    className="input pl-10"
                                                    value={passwordForm.old_password}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <hr className="border-gray-100 dark:border-slate-800 my-2" />
                                        <div>
                                            <label className="label">{t('settings.new_password')}</label>
                                            <div className="relative">
                                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="password"
                                                    className="input pl-10"
                                                    value={passwordForm.new_password}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                                    required
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">{t('settings.confirm_password')}</label>
                                            <div className="relative">
                                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="password"
                                                    className="input pl-10"
                                                    value={passwordForm.confirm_password}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full" isLoading={loading} leftIcon={<Save size={18} />}>
                                            {t('settings.change_password')}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <div className="space-y-6 max-w-md animate-fade-in">
                                <div>
                                    <h2 className="text-lg font-bold mb-1">{t('settings.data')}</h2>
                                    <p className="text-sm text-gray-500">{t('settings.data_desc')}</p>
                                </div>

                                {/* Backup Card */}
                                <Card className="p-4" noPadding={false}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                            <Database size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">{t('settings.backup_title')}</h3>
                                            <p className="text-xs text-gray-500">{t('settings.backup_desc')}</p>
                                        </div>
                                    </div>
                                    <Button onClick={handleBackup} variant="secondary" className="w-full" leftIcon={<Download size={16} />}>
                                        {t('settings.download_backup')}
                                    </Button>
                                </Card>

                                {/* Restore Card */}
                                <Card className="p-4" noPadding={false}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Upload size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">{t('settings.restore_title') || 'Restore Data'}</h3>
                                            <p className="text-xs text-gray-500">{t('settings.restore_desc') || 'Upload backup file to restore your data'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            accept=".json"
                                            className="hidden"
                                            id="backup-upload"
                                            onChange={handleRestore}
                                        />
                                        <label htmlFor="backup-upload">
                                            <div className="btn btn-primary w-full cursor-pointer flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-all">
                                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                                {t('settings.upload_backup') || 'Upload Backup File'}
                                            </div>
                                        </label>
                                        <p className="text-xs text-red-500 text-center mt-2">
                                            {t('settings.restore_warning') || 'Warning: This will replace all current data!'}
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </Card>
            </main>
        </div>
    );
}
