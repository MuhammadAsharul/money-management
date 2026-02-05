'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { Wallet, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.name, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Auth error:', err);
      // Try to get error message from backend
      const msg = err.response?.data || (isLogin ? t('auth.error_msg') : t('auth.error_create'));
      setError(typeof msg === 'string' ? msg : t('auth.error_system'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-orange-300 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-orange-800 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Wallet className="text-white" size={24} />
            </div>
            MoneyTracker
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            {t('auth.hero_title')}
          </h2>
          <p className="text-orange-100 text-lg mb-8 leading-relaxed">
            {t('auth.hero_desc')}
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10">
              <h3 className="font-semibold text-lg mb-1">{t('auth.hero_feature_1')}</h3>
              <p className="text-sm text-orange-100">{t('auth.hero_feature_1_desc')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10">
              <h3 className="font-semibold text-lg mb-1">{t('auth.hero_feature_2')}</h3>
              <p className="text-sm text-orange-100">{t('auth.hero_feature_2_desc')}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-orange-200">
          {t('auth.footer').replace('{year}', new Date().getFullYear().toString())}
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gray-50 lg:bg-white dark:bg-slate-800 lg:dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 mb-3 shadow-lg shadow-orange-500/20">
              <Wallet className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MoneyTracker</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {isLogin ? t('auth.title_login') : t('auth.title_register')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {isLogin
                ? t('auth.subtitle_login')
                : t('auth.subtitle_register')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start gap-2 animate-fadeIn">
              <div className="mt-0.5">⚠️</div>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field - always shown for login, and for register */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {isLogin ? t('auth.username') : t('auth.fullname')}
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder={isLogin ? t('auth.username_placeholder') : t('auth.fullname_placeholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email field - only for registration */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('auth.email')}</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('auth.password')}</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-11 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder={t('auth.password_placeholder')}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={!isLogin ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('auth.min_char')}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>{t('auth.processing')}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? t('auth.login_btn') : t('auth.register_btn')}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              {isLogin ? t('auth.have_account') : t('auth.no_account')}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="ml-2 font-semibold text-orange-500 hover:text-orange-600 hover:underline transition-all"
              >
                {isLogin ? t('auth.register_here') : t('auth.login_here')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
