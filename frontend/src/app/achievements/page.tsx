'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import FloatingMenu from '@/components/layout/FloatingMenu';
import { gamificationApi } from '@/lib/api';
import { GamificationStatus, Badge } from '@/types/definitions';
import { Loader2, Lock, Trophy } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

import { Card } from '@/components/ui/Card';
import { Badge as BadgeComponent } from '@/components/ui/Badge';

export default function AchievementsPage() {
    const router = useRouter();
    const { token, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [status, setStatus] = useState<GamificationStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        if (token) {
            loadData();
        }
    }, [token]);

    const loadData = async () => {
        try {
            const data = await gamificationApi.getStatus();
            setStatus(data);
        } catch (error) {
            console.error('Failed to load achievements:', error);
        } finally {
            setLoading(false);
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

    // Mock badges if none returned (for demo/development)
    const allBadges: Badge[] = [
        { id: 1, name: t('achievements.badges.1.name'), description: t('achievements.badges.1.description'), icon: "📝", criteria: t('achievements.badges.1.criteria') },
        { id: 2, name: t('achievements.badges.2.name'), description: t('achievements.badges.2.description'), icon: "🔥", criteria: t('achievements.badges.2.criteria') },
        { id: 3, name: t('achievements.badges.3.name'), description: t('achievements.badges.3.description'), icon: "🛡️", criteria: t('achievements.badges.3.criteria') },
        { id: 4, name: t('achievements.badges.4.name'), description: t('achievements.badges.4.description'), icon: "👑", criteria: t('achievements.badges.4.criteria') },
        { id: 5, name: t('achievements.badges.5.name'), description: t('achievements.badges.5.description'), icon: "💰", criteria: t('achievements.badges.5.criteria') },
    ];

    const unlockedIds = status?.badges.map(b => b.id) || [];

    return (
        <div className="min-h-screen pb-24">
            <FloatingMenu />

            <main className="max-w-4xl mx-auto p-4">
                <div className="flex items-center gap-3 mb-8 pt-12 lg:pt-0">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                        <Trophy className="text-yellow-600 dark:text-yellow-400" size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{t('achievements.title')}</h1>
                        <p style={{ color: 'rgb(var(--muted))' }}>{t('achievements.subtitle')}</p>
                    </div>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allBadges.map((badge) => {
                        const isUnlocked = unlockedIds.includes(badge.id);
                        return (
                            <Card
                                key={badge.id}
                                className={`relative overflow-hidden transition-all ${isUnlocked ? 'border-yellow-200 dark:border-yellow-900' : 'opacity-70 grayscale'}`}
                            >
                                {isUnlocked && (
                                    <div className="absolute top-0 right-0">
                                        <BadgeComponent variant="warning" className="rounded-none rounded-bl-lg">
                                            {t('achievements.unlocked')}
                                        </BadgeComponent>
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0 ${isUnlocked ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        {isUnlocked ? badge.icon : <Lock size={24} className="text-gray-400" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{badge.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{badge.description}</p>
                                        <BadgeComponent variant="default">
                                            {t('achievements.criteria')}: {badge.criteria}
                                        </BadgeComponent>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
