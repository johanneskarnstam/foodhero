import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Commit } from '../types';

interface WhatsNewModalProps {
    isOpen: boolean;
    commits: Commit[];
    onClose: () => void;
}

function categorizeCommit(message: string): { emoji: string; label: string; rawMessage: string } {
    let emoji = '📝';
    let label = 'other';
    let rawMessage = message;

    if (message.startsWith('feat:')) {
        emoji = '✨';
        label = 'feat';
        rawMessage = message.replace('feat:', '').trim();
    } else if (message.startsWith('feat(')) {
        emoji = '✨';
        label = 'feat';
        rawMessage = message.replace(/^feat\([^)]+\):/, '').trim();
    } else if (message.startsWith('fix:')) {
        emoji = '🐛';
        label = 'fix';
        rawMessage = message.replace('fix:', '').trim();
    } else if (message.startsWith('fix(')) {
        emoji = '🐛';
        label = 'fix';
        rawMessage = message.replace(/^fix\([^)]+\):/, '').trim();
    } else if (message.startsWith('refactor:')) {
        emoji = '🔧';
        label = 'refactor';
        rawMessage = message.replace('refactor:', '').trim();
    } else if (message.startsWith('refactor(')) {
        emoji = '🔧';
        label = 'refactor';
        rawMessage = message.replace(/^refactor\([^)]+\):/, '').trim();
    }

    return { emoji, label, rawMessage };
}

function formatDate(dateStr: string) {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr.split(' ')[0] || dateStr;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    } catch {
        return dateStr.split(' ')[0] || dateStr;
    }
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, commits, onClose }) => {
    const { t } = useTranslation();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Handle body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Group commits by date
    const groupedCommits = commits.reduce((acc, commit) => {
        const date = formatDate(commit.date);
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(commit);
        return acc;
    }, {} as Record<string, Commit[]>);

    return (
        <div 
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="whats-new-title"
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 id="whats-new-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {t('whatsNew.title', 'Nyheter sedan ditt senaste besök')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label={t('whatsNew.close', 'Stäng')}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    {Object.entries(groupedCommits).map(([date, dayCommits]) => (
                        <div key={date} className="mb-6 last:mb-0">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                                {date}
                            </h3>
                            <div className="space-y-4">
                                {dayCommits.map((commit) => {
                                    const { emoji, label, rawMessage } = categorizeCommit(commit.message);
                                    return (
                                        <div key={commit.hash} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <div className="text-xl shrink-0 mt-0.5" aria-hidden="true">{emoji}</div>
                                            <div>
                                                <div className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mb-1">
                                                    {t(`whatsNew.categories.${label}`, label)}
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                                    {rawMessage.charAt(0).toUpperCase() + rawMessage.slice(1)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                    >
                        {t('whatsNew.close', 'Stäng')}
                    </button>
                </div>
            </div>
        </div>
    );
};
