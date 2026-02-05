'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { calendarApi } from '@/lib/api';
import { CalendarEvent, CalendarResponse } from '@/types/definitions';
import { formatCurrency } from '@/lib/utils';
import FloatingMenu from '@/components/layout/FloatingMenu';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar as CalendarIcon,
    ArrowUpRight,
    ArrowDownRight,
    HandCoins,
    Repeat
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarPage() {
    const router = useRouter();
    const { token, loading: authLoading } = useAuth();
    const { t } = useLanguage();

    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        if (token) {
            loadEvents();
        }
    }, [token, currentMonth, currentYear]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const data: CalendarResponse = await calendarApi.getEvents(currentMonth, currentYear);
            setEvents(data.events || []);
        } catch (error) {
            console.error('Failed to load calendar events:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const prevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month - 1, 1).getDay();
    };

    const getEventsForDate = (date: string) => {
        return events.filter(e => e.date === date);
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
        const cells = [];

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="h-20 md:h-24 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = getEventsForDate(dateStr);
            const isToday = dateStr === now.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;

            cells.push(
                <div
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-20 md:h-24 p-1 border cursor-pointer transition-all ${isToday
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        } ${isSelected ? 'ring-2 ring-orange-500' : ''}`}
                >
                    <div className={`text-xs font-medium mb-1 ${isToday ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                        {day}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((event, idx) => (
                            <div
                                key={idx}
                                className={`text-xs px-1 py-0.5 rounded truncate ${event.type === 'income'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : event.type === 'expense'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : event.type === 'debt_payable'
                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}
                            >
                                {event.category_icon || '📅'} {event.title.slice(0, 10)}
                            </div>
                        ))}
                        {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-400">+{dayEvents.length - 2} more</div>
                        )}
                    </div>
                </div>
            );
        }

        return cells;
    };

    const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24">
            <FloatingMenu />

            <main className="max-w-4xl mx-auto p-4 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="text-orange-500" size={28} />
                        <h1 className="text-2xl font-bold">{t('calendar.title')}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={prevMonth}>
                            <ChevronLeft size={20} />
                        </Button>
                        <span className="font-semibold min-w-[140px] text-center">
                            {MONTHS[currentMonth - 1]} {currentYear}
                        </span>
                        <Button variant="ghost" size="sm" onClick={nextMonth}>
                            <ChevronRight size={20} />
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-orange-500" size={40} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendar Grid */}
                        <Card className="lg:col-span-2 p-0 overflow-hidden">
                            {/* Day Headers */}
                            <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                {DAYS.map(day => (
                                    <div key={day} className="text-center text-xs font-medium py-2 text-gray-500">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            {/* Calendar Cells */}
                            <div className="grid grid-cols-7">
                                {renderCalendarGrid()}
                            </div>
                        </Card>

                        {/* Event Details Panel */}
                        <Card>
                            <h3 className="font-semibold mb-4">
                                {selectedDate
                                    ? new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : t('calendar.select_date')}
                            </h3>

                            {selectedEvents.length === 0 ? (
                                <p className="text-gray-400 text-sm">{t('calendar.no_events')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedEvents.map((event, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3 rounded-lg border dark:border-gray-700 flex items-start gap-3"
                                        >
                                            <div className={`p-2 rounded-lg ${event.type === 'income'
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : event.type === 'expense'
                                                    ? 'bg-red-100 dark:bg-red-900/30'
                                                    : 'bg-amber-100 dark:bg-amber-900/30'
                                                }`}>
                                                {event.source === 'recurring' ? (
                                                    <Repeat size={18} className={event.type === 'income' ? 'text-green-600' : 'text-red-600'} />
                                                ) : (
                                                    <HandCoins size={18} className="text-amber-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">{event.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {event.source === 'recurring' ? t('calendar.recurring') : t('calendar.debt_due')}
                                                </p>
                                            </div>
                                            <div className={`font-semibold ${event.type === 'income' || event.type === 'debt_receivable'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                {event.type === 'income' || event.type === 'debt_receivable' ? '+' : '-'}
                                                {formatCurrency(event.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}
