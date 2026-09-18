import React from 'react';
import { X } from 'lucide-react';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

/**
 * Enkel informationsmodal utan bekräfta/avbryt-knappar.
 * Lämplig för förklarande texter som t.ex. prestandaindex-beskrivningen.
 */
export const InfoModal: React.FC<InfoModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
}) => {
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
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-labelledby="info-modal-title"
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-0">
                    <h3
                        id="info-modal-title"
                        className="text-lg font-bold text-gray-900 dark:text-white"
                    >
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                        aria-label="Stäng"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto custom-scrollbar text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {children}
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 pt-1 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/60 dark:hover:bg-gray-700 border border-gray-200/70 dark:border-gray-600/50 transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
