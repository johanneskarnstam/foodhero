import React, { useState, useEffect, useMemo } from 'react';
import { 
    CheckSquare, 
    Square, 
    ShoppingCart, 
    Plus, 
    Utensils, 
    X, 
    AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface PlannedMealWithIngredients {
    name: string;
    mealType?: string;
    ingredients?: {
        text: string;
        amount?: string;
        checkIfExistAtHome?: boolean;
    }[];
}

interface IngredientSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    plannedMeals: PlannedMealWithIngredients[];
    onConfirm: (selectedItems: { text: string; amount?: string }[]) => Promise<void> | void;
}

interface ProcessedIngredient {
    id: string;
    text: string;
    amount?: string;
    mealNames: string[];
    isPantry: boolean;
    isCustom?: boolean;
}

// Common Swedish & English pantry staples
const PANTRY_KEYWORDS = [
    'salt', 'peppar', 'vitpeppar', 'svartpeppar', 'smör', 'olja', 'matolja', 'olivolja', 'rapsolja',
    'vetemjöl', 'mjöl', 'socker', 'strösocker', 'bakpulver', 'soja', 'vatten', 'buljongtärning',
    'spiskummin', 'oregano', 'paprikapulver', 'torkad timjan', 'curry', 'kanel', 'kardemumma',
    'flour', 'sugar', 'pepper', 'butter', 'oil', 'olive oil', 'water'
];

const isPantryStaple = (text: string, checkIfExistAtHome?: boolean): boolean => {
    if (checkIfExistAtHome) return true;
    const lower = text.trim().toLowerCase();
    return PANTRY_KEYWORDS.some(kw => lower === kw || lower.startsWith(kw + ' ') || lower.endsWith(' ' + kw));
};

export const IngredientSelectionModal: React.FC<IngredientSelectionModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    plannedMeals = [],
    onConfirm
}) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<'combined' | 'byMeal'>('combined');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [customIngredients, setCustomIngredients] = useState<ProcessedIngredient[]>([]);
    const [newCustomInput, setNewCustomInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Build unique list of processed ingredients (Combined view)
    const combinedIngredients = useMemo(() => {
        const itemMap = new Map<string, ProcessedIngredient>();

        plannedMeals.forEach((meal, mealIdx) => {
            meal.ingredients?.forEach((ing, ingIdx) => {
                const key = ing.text.trim().toLowerCase();
                const existing = itemMap.get(key);
                const isPantry = isPantryStaple(ing.text, ing.checkIfExistAtHome);

                if (existing) {
                    if (!existing.mealNames.includes(meal.name)) {
                        existing.mealNames.push(meal.name);
                    }
                    if (ing.amount && !existing.amount?.includes(ing.amount)) {
                        existing.amount = existing.amount ? `${existing.amount} + ${ing.amount}` : ing.amount;
                    }
                } else {
                    itemMap.set(key, {
                        id: `ing-${mealIdx}-${ingIdx}-${key}`,
                        text: ing.text.trim(),
                        amount: ing.amount,
                        mealNames: [meal.name],
                        isPantry
                    });
                }
            });
        });

        return [...Array.from(itemMap.values()), ...customIngredients];
    }, [plannedMeals, customIngredients]);

    // Handle body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Initial check state on modal open
    useEffect(() => {
        if (isOpen) {
            setCustomIngredients([]);
            setNewCustomInput('');
            setIsSubmitting(false);

            // Pre-select all ingredients except pantry staples marked with checkIfExistAtHome
            const initialSelected = new Set<string>();
            combinedIngredients.forEach(item => {
                if (!item.isPantry) {
                    initialSelected.add(item.id);
                }
            });
            // If all were pantry, still default to selecting all so user has something
            if (initialSelected.size === 0 && combinedIngredients.length > 0) {
                combinedIngredients.forEach(item => initialSelected.add(item.id));
            }
            setSelectedIds(initialSelected);
        }
    }, [isOpen, plannedMeals]);

    if (!isOpen) return null;

    const toggleItem = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        setSelectedIds(new Set(combinedIngredients.map(item => item.id)));
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleUncheckPantry = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            combinedIngredients.forEach(item => {
                if (item.isPantry) {
                    next.delete(item.id);
                }
            });
            return next;
        });
    };

    const handleAddCustom = (e?: React.FormEvent, mealTargetName?: string) => {
        if (e) e.preventDefault();
        const trimmed = newCustomInput.trim();
        if (!trimmed) return;

        const newId = `custom-${Date.now()}-${Math.random()}`;
        const newIng: ProcessedIngredient = {
            id: newId,
            text: trimmed,
            mealNames: mealTargetName ? [mealTargetName] : ['Extra'],
            isPantry: false,
            isCustom: true
        };

        setCustomIngredients(prev => [...prev, newIng]);
        setSelectedIds(prev => new Set(prev).add(newId));
        setNewCustomInput('');
    };

    const handleConfirmTransfer = async () => {
        setIsSubmitting(true);
        const itemsToTransfer = combinedIngredients
            .filter(item => selectedIds.has(item.id))
            .map(item => ({
                text: item.text,
                amount: item.amount
            }));

        try {
            await onConfirm(itemsToTransfer);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Free text meals with no recipe ingredients
    const freeTextMeals = plannedMeals.filter(m => !m.ingredients || m.ingredients.length === 0);

    const selectedCount = selectedIds.size;

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ingredient-selection-title"
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-xl md:max-w-[calc(100vw-2rem)] 2xl:max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div>
                            <h2
                                id="ingredient-selection-title"
                                className="text-lg font-bold text-gray-900 dark:text-gray-100"
                            >
                                {title || t('ingredientSelection.title', 'Välj ingredienser till inköpslistan')}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {subtitle || t('ingredientSelection.subtitle', 'Bocka av varor du redan har hemma')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar / Quick Actions */}
                <div className="px-5 pt-3 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30">
                    {/* View Switcher */}
                    <div className="flex bg-gray-200/70 dark:bg-gray-700/60 p-0.5 rounded-lg text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setViewMode('combined')}
                            className={`px-2.5 py-1 rounded-md transition-all ${
                                viewMode === 'combined'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                                    : 'text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            {t('ingredientSelection.viewCombined', 'Sammanställd')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('byMeal')}
                            className={`px-2.5 py-1 rounded-md transition-all ${
                                viewMode === 'byMeal'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                                    : 'text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            {t('ingredientSelection.viewByMeal', 'Per måltid')}
                        </button>
                    </div>

                    {/* Quick check buttons */}
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            {t('ingredientSelection.selectAll', 'Markera alla')}
                        </button>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            {t('ingredientSelection.deselectAll', 'Avmarkera alla')}
                        </button>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <button
                            type="button"
                            onClick={handleUncheckPantry}
                            className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                        >
                            {t('ingredientSelection.uncheckPantry', 'Bocka av basvaror')}
                        </button>
                    </div>
                </div>

                {/* List Container */}
                <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                    {/* Free-text Meals Notice / Fast Input */}
                    {freeTextMeals.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-blue-900 dark:text-blue-200">
                                    <span className="font-semibold">{freeTextMeals.map(m => m.name).join(', ')}</span>
                                    <p className="text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                                        {t('ingredientSelection.freeTextMealHint', 'Fritexträtt utan recept. Skriv in ingredienser nedan om du behöver handla något.')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Combined View */}
                    {viewMode === 'combined' && (
                        <div className="space-y-1.5">
                            {combinedIngredients.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 py-6">
                                    {t('ingredientSelection.noIngredients', 'Inga ingredienser valda.')}
                                </p>
                            ) : (
                                combinedIngredients.map(item => {
                                    const isSelected = selectedIds.has(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItem(item.id)}
                                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                                isSelected
                                                    ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-gray-900 dark:text-gray-100'
                                                    : 'border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-400 dark:text-gray-500 opacity-70'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className={`p-0.5 rounded transition-colors ${
                                                    isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                                                }`}>
                                                    {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-medium ${
                                                            isSelected ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'line-through text-gray-400 dark:text-gray-500'
                                                        }`}>
                                                            {item.text}
                                                        </span>
                                                        {item.amount && (
                                                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 font-medium">
                                                                {item.amount}
                                                            </span>
                                                        )}
                                                        {item.isPantry && (
                                                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full font-medium">
                                                                {t('ingredientSelection.pantryItem', 'Basvara')}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {item.mealNames.length > 0 && (
                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                            {item.mealNames.join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* By Meal View */}
                    {viewMode === 'byMeal' && (
                        <div className="space-y-4">
                            {plannedMeals.map((meal, mealIdx) => (
                                <div key={mealIdx} className="space-y-1.5">
                                    <div className="flex items-center gap-2 px-1">
                                        <Utensils className="w-3.5 h-3.5 text-blue-500" />
                                        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                            {meal.name}
                                        </h3>
                                    </div>

                                    {!meal.ingredients || meal.ingredients.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic px-2 py-1">
                                            {t('views.noIngredients', 'Inga ingredienser listade')}
                                        </p>
                                    ) : (
                                        meal.ingredients.map((ing, ingIdx) => {
                                            const itemId = combinedIngredients.find(
                                                ci => ci.text.toLowerCase() === ing.text.trim().toLowerCase()
                                            )?.id || `ing-${mealIdx}-${ingIdx}`;
                                            const isSelected = selectedIds.has(itemId);

                                            return (
                                                <div
                                                    key={ingIdx}
                                                    onClick={() => toggleItem(itemId)}
                                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                                        isSelected
                                                            ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20'
                                                            : 'border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-400 opacity-70'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}>
                                                            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                        </div>
                                                        <span className={`text-sm font-medium ${
                                                            isSelected ? 'text-gray-900 dark:text-gray-100' : 'line-through text-gray-400'
                                                        }`}>
                                                            {ing.text}
                                                        </span>
                                                    </div>
                                                    {ing.amount && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {ing.amount}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Custom Ingredient input */}
                    <form onSubmit={handleAddCustom} className="flex items-center gap-2 pt-2">
                        <input
                            type="text"
                            value={newCustomInput}
                            onChange={(e) => setNewCustomInput(e.target.value)}
                            placeholder={t('ingredientSelection.addCustomPlaceholder', 'Lägg till extra vara...')}
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                            type="submit"
                            disabled={!newCustomInput.trim()}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {t('ingredientSelection.addCustom', 'Lägg till')}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                    >
                        {t('common.cancel', 'Avbryt')}
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirmTransfer}
                        disabled={selectedCount === 0 || isSubmitting}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span>
                            {t('ingredientSelection.transferToShoppingList', `Lägg till ${selectedCount} varor i inköpslistan`, { count: selectedCount })}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
