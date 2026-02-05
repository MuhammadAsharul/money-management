import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { FinancialScoreResponse } from '@/types/definitions';
import { useLanguage } from '@/lib/language-context';
import { Activity, PiggyBank, ShoppingBag, Lightbulb } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';

interface Props {
    data: FinancialScoreResponse | null;
    loading: boolean;
}

export default function FinancialHealth({ data, loading }: Props) {
    const { t } = useLanguage();

    if (loading) {
        return <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>;
    }

    if (!data) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#22c55e'; // Green
        if (score >= 60) return '#eab308'; // Yellow
        return '#ef4444'; // Red
    };

    return (
        <Card>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="text-primary" />
                {t('financial_health.title')}
            </h2>

            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Main Score Circle */}
                <div className="w-40 h-40 shrink-0">
                    <CircularProgressbar
                        value={data.score}
                        text={`${data.score}`}
                        styles={buildStyles({
                            textSize: '24px',
                            pathColor: getScoreColor(data.score),
                            textColor: getScoreColor(data.score),
                            trailColor: '#f3f4f6',
                        })}
                    />
                    <p className="text-center text-sm text-gray-500 mt-2 font-medium">{t('financial_health.overall_score')}</p>
                </div>

                {/* Metrics Breakdown */}
                <div className="flex-1 w-full space-y-4">
                    {/* Consistency */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Activity size={16} className="text-blue-500" /> {t('financial_health.consistency')}
                            </span>
                            <span className="font-bold">{data.consistency_score}/100</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${data.consistency_score}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Savings Ratio */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <PiggyBank size={16} className="text-green-500" /> {t('financial_health.savings_ratio')}
                            </span>
                            <span className="font-bold">{data.savings_score}/100</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${data.savings_score}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Spending Control */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <ShoppingBag size={16} className="text-orange-500" /> {t('financial_health.spending_control')}
                            </span>
                            <span className="font-bold">{data.spending_score}/100</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-orange-500 rounded-full transition-all"
                                style={{ width: `${data.spending_score}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tips Section */}
            {data.tips.length > 0 && (
                <div className="mt-10">
                    <Alert variant="info" title={t('financial_health.coach_tips')}>
                        <ul className="space-y-1 mt-1">
                            {data.tips.map((tip, index) => (
                                <li key={index} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:font-bold">
                                    {t(`financial_health.tips.${tip}` as any) || tip}
                                </li>
                            ))}
                        </ul>
                    </Alert>
                </div>
            )}
        </Card>
    );
}
