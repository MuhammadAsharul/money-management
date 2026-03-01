'use client';

import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
    isOpen,
    onConfirm,
    onCancel,
    title = 'Konfirmasi',
    message,
    confirmText = 'Ya, Hapus',
    cancelText = 'Batal',
    variant = 'danger',
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            button: 'bg-red-600 hover:bg-red-700 text-white',
        },
        warning: {
            icon: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
            button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        },
        info: {
            icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            button: 'bg-blue-600 hover:bg-blue-700 text-white',
        },
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scaleIn">
                <div className="p-6 text-center">
                    <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${styles.icon}`}>
                        <AlertTriangle size={28} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
                </div>
                <div className="flex gap-3 p-4 pt-0 justify-center">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${styles.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
