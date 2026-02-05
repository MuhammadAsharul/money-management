'use client';

import { Button } from '@/components/ui/Button';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false,
    confirmLabel = 'Hapus',
    cancelLabel = 'Batal',
    variant = 'danger'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{message}</p>
                <div className="flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        isLoading={isLoading}
                        className="flex-1"
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
