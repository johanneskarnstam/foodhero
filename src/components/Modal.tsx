import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    isDestructive = false,
    children,
}) => {
    const { t } = useTranslation();
    const finalConfirmText = confirmText || t('common.confirm');
    const finalCancelText = cancelText || t('common.cancel');

    // Handle keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    // Handle body scroll lock
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
            // Also ensure we clean up if the component unmounts while open
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
            <div role="dialog" aria-labelledby="modal-title" aria-describedby="modal-message" className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden transform transition-all">
                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h3 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    {message && (
                        <p id="modal-message" className="text-gray-600 dark:text-gray-300 mb-6">
                            {message}
                        </p>
                    )}
                    <div className="flex-1">
                        {children}
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-2 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {finalCancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${isDestructive
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {finalConfirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
