import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw, Send, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Meal } from '../types';
import { useRecipeAiHelp } from '../hooks/useRecipeAiHelp';

interface RecipeAiHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    meal: Meal | null;
}

export const RecipeAiHelpModal: React.FC<RecipeAiHelpModalProps> = ({ isOpen, onClose, meal }) => {
    const { t } = useTranslation();
    const {
        messages,
        isLoading,
        error,
        suggestedModel,
        askQuestion,
        retry,
        clearError,
        applySuggestedModel,
    } = useRecipeAiHelp(meal, isOpen);
    const [question, setQuestion] = useState('');
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);
    const previousBodyOverflowRef = useRef('');

    useEffect(() => {
        if (!isOpen) return;

        triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        closeButtonRef.current?.focus();
        previousBodyOverflowRef.current = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousBodyOverflowRef.current;
            triggerRef.current?.focus();
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) setQuestion('');
    }, [isOpen, meal?.id]);

    if (!isOpen || !meal) return null;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const normalizedQuestion = question.trim();
        if (!normalizedQuestion || isLoading) return;

        setQuestion('');
        await askQuestion(normalizedQuestion);
    };

    const handleQuestionKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
        }
    };

    const quickQuestions = [
        t('recipeAiHelp.quickQuestionSubstitute'),
        t('recipeAiHelp.quickQuestionMissing'),
        t('recipeAiHelp.quickQuestionSteps'),
    ];

    return (
        <div
            className="fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipe-ai-help-title"
            onMouseDown={event => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200"
            >
                <header className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 id="recipe-ai-help-title" className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                {t('recipeAiHelp.title')}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {meal.name}
                            </p>
                        </div>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label={t('common.close', 'Stäng')}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </header>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="text-center py-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {t('recipeAiHelp.intro')}
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 mt-4" aria-label={t('recipeAiHelp.quickQuestionsLabel')}>
                                {quickQuestions.map(quickQuestion => (
                                    <button
                                        key={quickQuestion}
                                        type="button"
                                        onClick={() => {
                                            setQuestion(quickQuestion);
                                            void askQuestion(quickQuestion);
                                        }}
                                        disabled={isLoading}
                                        className="px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50 transition-colors"
                                    >
                                        {quickQuestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.length > 0 && (
                        <div className="space-y-3" aria-live="polite">
                            {messages.map((message, index) => (
                                <div
                                    key={`${message.role}-${index}`}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                                        message.role === 'user'
                                            ? 'bg-purple-600 text-white rounded-br-md'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-md'
                                    }`}>
                                        {message.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start" role="status">
                                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('recipeAiHelp.loading')}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" role="alert">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearError();
                                        void retry();
                                    }}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-300 hover:underline disabled:opacity-50 shrink-0"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {t('recipeAiHelp.retry')}
                                </button>
                            </div>
                            {suggestedModel && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        applySuggestedModel(suggestedModel.id);
                                        void retry();
                                    }}
                                    className="mt-3 text-xs font-medium text-red-700 dark:text-red-300 hover:underline"
                                >
                                    {t('ai.useSuggestedModel', { model: suggestedModel.name })}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
                    <label htmlFor="recipe-ai-help-question" className="sr-only">
                        {t('recipeAiHelp.questionLabel')}
                    </label>
                    <div className="flex items-end gap-2">
                        <textarea
                            id="recipe-ai-help-question"
                            value={question}
                            onChange={event => {
                                setQuestion(event.target.value);
                                if (error) clearError();
                            }}
                            onKeyDown={handleQuestionKeyDown}
                            placeholder={t('recipeAiHelp.placeholder')}
                            rows={2}
                            disabled={isLoading}
                            className="flex-1 resize-none px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                        />
                        <button
                            type="submit"
                            aria-label={t('recipeAiHelp.send')}
                            disabled={!question.trim() || isLoading}
                            className="p-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                        {t('recipeAiHelp.disclaimer')}
                    </p>
                </form>
            </div>
        </div>
    );
};
