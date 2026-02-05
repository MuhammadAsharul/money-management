import { GamificationStatus } from '@/types/definitions';
import { Trophy, Zap, Star, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { Card } from '@/components/ui/Card';

interface Props {
    status: GamificationStatus | null;
    loading: boolean;
}

export default function GamificationCard({ status, loading }: Props) {
    const { t } = useLanguage();

    if (loading) {
        return <div className="animate-pulse h-36 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>;
    }

    if (!status) return null;

    const progressPercent = Math.min((status.xp / status.next_level_xp) * 100, 100);

    return (
        <Card
            className="border-0 overflow-hidden relative group hover-lift"
            noPadding
            style={{
                background: 'rgb(var(--primary))',
                color: 'white'
            }}
        >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Trophy size={140} />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

            <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-lg ring-1 ring-white/30 group-hover:rotate-12 transition-transform duration-300">
                            <Trophy className="text-yellow-100 drop-shadow-md" size={32} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-100 uppercase tracking-widest mb-1">{t('gamification.level')}</p>
                            <h3 className="font-black text-4xl leading-none drop-shadow-sm">{status.level}</h3>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full ring-1 ring-white/10 shadow-sm">
                            <Zap className="text-yellow-300 fill-yellow-300" size={16} />
                            <span className="text-sm font-bold text-white">{status.current_streak} {t('gamification.days')}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-xs font-bold text-white/90 uppercase tracking-wider">
                        <span>XP Progress</span>
                        <span>{status.xp} / {status.next_level_xp}</span>
                    </div>

                    <div className="h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm ring-1 ring-white/20 shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${progressPercent}%`, backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' }}
                        >
                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-1 text-xs text-amber-50 font-medium pt-1">
                        <TrendingUp size={12} />
                        <span>{status.next_level_xp - status.xp} XP to Level {status.level + 1}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
