import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, RefreshCw, Save, ChefHat, AlertCircle, Users, Tag } from 'lucide-react';
import { useAiRecipe } from '../hooks/useAiRecipe';
import { GeneratedRecipe } from '../services/aiService';
import { Meal } from '../types';

interface AiRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recipe: Omit<Meal, 'id' | 'createdAt'>) => Promise<void>;
}

/**
 * Modal för att generera ett nytt recept med Gemini AI.
 *
 * Flöde:
 * 1. Användaren skriver en fri textprompt.
 * 2. AI genererar ett komplett recept som visas i förhandsvisning.
 * 3. Användaren kan spara, generera om eller stänga.
 */
export const AiRecipeModal: React.FC<AiRecipeModalProps> = ({ isOpen, onClose, onSave }) => {
    const { t } = useTranslation();
    const { isLoading, error, generateRecipe, clearError } = useAiRecipe();

    const [prompt, setPrompt] = useState('');
    const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Återställ state när modalen öppnas/stängs
    useEffect(() => {
        if (isOpen) {
            setPrompt('');
            setRecipe(null);
            clearError();
        }
    }, [isOpen, clearError]);

    if (!isOpen) return null;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;
        const result = await generateRecipe(prompt.trim());
        if (result) setRecipe(result);
    };

    const handleRegenerate = async () => {
        if (!prompt.trim() || isLoading) return;
        setRecipe(null);
        const result = await generateRecipe(prompt.trim());
        if (result) setRecipe(result);
    };

    const handleSave = async () => {
        if (!recipe || isSaving) return;
        setIsSaving(true);
        try {
            await onSave({
                name: recipe.name,
                description: recipe.description || undefined,
                servings: recipe.servings,
                tags: recipe.tags,
                ingredients: recipe.ingredients.map(i => ({
                    text: i.text,
                    amount: i.amount || undefined,
                    checkIfExistAtHome: false,
                })),
                instructions: recipe.instructions,
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const hasRecipe = recipe !== null;

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-recipe-modal-title"
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 id="ai-recipe-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
                            {t('ai.promptTitle')}
                        </h2>
                    </div>
                    <button
                        id="ai-recipe-modal-close"
                        onClick={onClose}
                        aria-label={t('common.close', 'Stäng')}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Prompt-formulär */}
                    <form id="ai-recipe-form" onSubmit={handleGenerate}>
                        <label
                            htmlFor="ai-recipe-prompt"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                            {t('ai.recipePromptLabel')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="ai-recipe-prompt"
                                type="text"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder={t('ai.recipePromptPlaceholder')}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 transition"
                            />
                            <button
                                id="ai-recipe-generate-btn"
                                type="submit"
                                disabled={!prompt.trim() || isLoading}
                                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center gap-2 transition-colors shrink-0"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        {t('ai.generating')}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        {t('ai.generate')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Felmeddelande */}
                    {error && (
                        <div
                            id="ai-recipe-error"
                            role="alert"
                            className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        >
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Förhandsvisning av recept */}
                    {hasRecipe && (
                        <div id="ai-recipe-preview" className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Recept-header */}
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center shrink-0">
                                        <ChefHat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 id="ai-recipe-name" className="text-base font-bold text-gray-900 dark:text-white truncate">
                                            {recipe.name}
                                        </h3>
                                        {recipe.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                {recipe.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Meta-info */}
                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                    {recipe.servings > 0 && (
                                        <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                            <Users className="w-3.5 h-3.5" />
                                            {recipe.servings} {t('ai.servings')}
                                        </span>
                                    )}
                                    {recipe.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {recipe.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                                                >
                                                    <Tag className="w-3 h-3" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ingredienser */}
                            {recipe.ingredients.length > 0 && (
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        {t('ai.ingredients')}
                                    </h4>
                                    <ul className="space-y-1">
                                        {recipe.ingredients.map((ing, idx) => (
                                            <li key={idx} className="flex items-baseline gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                {ing.amount && (
                                                    <span className="text-purple-600 dark:text-purple-400 font-medium shrink-0 text-xs">
                                                        {ing.amount}
                                                    </span>
                                                )}
                                                <span>{ing.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Instruktioner */}
                            {recipe.instructions.length > 0 && (
                                <div className="p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        {t('ai.instructions')}
                                    </h4>
                                    <ol className="space-y-2">
                                        {recipe.instructions.map((step, idx) => (
                                            <li key={idx} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer med åtgärdsknappar */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3 shrink-0">
                    <button
                        id="ai-recipe-cancel-btn"
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {t('common.cancel', 'Avbryt')}
                    </button>

                    <div className="flex items-center gap-2">
                        {hasRecipe && (
                            <button
                                id="ai-recipe-regenerate-btn"
                                type="button"
                                onClick={handleRegenerate}
                                disabled={isLoading || !prompt.trim()}
                                className="px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {t('ai.regenerate')}
                            </button>
                        )}

                        {hasRecipe && (
                            <button
                                id="ai-recipe-save-btn"
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? t('common.savingShort') : t('ai.saveRecipe')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
