import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Utensils, Tag, Sparkles, Eye, Dices, ArrowLeft, Check, X, Bookmark } from 'lucide-react';
import { Meal, MealType } from '../types';
import { useTranslation } from 'react-i18next';

interface RandomMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (meal: Meal) => void;
    meals: Meal[];
    mealSuggestions: Meal[];
    filters?: {
        tags?: string[];
        ingredients?: string[];
        mealType?: MealType;
    };
    onPreviewRecipe?: (meal: Meal) => void;
}

export const RandomMealModal: React.FC<RandomMealModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    meals = [],
    mealSuggestions = [],
    filters,
    onPreviewRecipe
}) => {
    const { t } = useTranslation();
    const [source, setSource] = useState<'all' | 'myMeals' | 'suggestions'>('all');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [currentMeal, setCurrentMeal] = useState<Meal | null>(null);
    const [history, setHistory] = useState<Meal[]>([]);

    // Combine or filter pool based on source
    const mealPool = useMemo(() => {
        if (source === 'myMeals') {
            return meals;
        }
        if (source === 'suggestions') {
            const savedNames = new Set(meals.map(m => m.name.trim().toLowerCase()));
            return mealSuggestions.filter(s => !savedNames.has(s.name.trim().toLowerCase()));
        }
        // 'all' - deduplicated by name
        const combined: Meal[] = [...meals];
        const existingNames = new Set(meals.map(m => m.name.trim().toLowerCase()));
        mealSuggestions.forEach(s => {
            if (!existingNames.has(s.name.trim().toLowerCase())) {
                combined.push(s);
            }
        });
        return combined;
    }, [source, meals, mealSuggestions]);

    // Available tags for the current pool
    const availableTags = useMemo(() => {
        const tagSet = new Set<string>();
        mealPool.forEach(meal => {
            meal.tags?.forEach(tag => {
                if (tag.trim()) tagSet.add(tag.trim());
            });
        });
        return Array.from(tagSet);
    }, [mealPool]);

    // Filter meals matching the active tag & incoming filters
    const filteredMeals = useMemo(() => {
        return mealPool.filter(meal => {
            // Check active tag filter in modal
            if (selectedTag) {
                if (!meal.tags || !meal.tags.some(tg => tg.toLowerCase() === selectedTag.toLowerCase())) {
                    return false;
                }
            }

            // Check props filters
            if (filters?.tags && filters.tags.length > 0) {
                if (!meal.tags || meal.tags.length === 0) return false;
                const hasMatchingTag = meal.tags.some(tag => 
                    filters.tags!.some(filterTag => 
                        tag.toLowerCase().includes(filterTag.toLowerCase())
                    )
                );
                if (!hasMatchingTag) return false;
            }
            
            if (filters?.ingredients && filters.ingredients.length > 0) {
                if (!meal.ingredients || meal.ingredients.length === 0) return false;
                const hasMatchingIngredient = meal.ingredients.some(ing => 
                    filters.ingredients!.some(filterIng => 
                        ing.text.toLowerCase().includes(filterIng.toLowerCase())
                    )
                );
                if (!hasMatchingIngredient) return false;
            }
            
            return true;
        });
    }, [mealPool, selectedTag, filters]);

    const getRandomMealFromList = useCallback((list: Meal[], excludeMealId?: string): Meal | null => {
        if (list.length === 0) return null;
        if (list.length === 1) return list[0];
        
        const candidateList = excludeMealId 
            ? list.filter(m => m.id !== excludeMealId) 
            : list;
        const targetList = candidateList.length > 0 ? candidateList : list;
        const randomIndex = Math.floor(Math.random() * targetList.length);
        return targetList[randomIndex];
    }, []);

    // Initial setup on open or pool change
    useEffect(() => {
        if (isOpen) {
            setHistory([]);
            const initial = getRandomMealFromList(filteredMeals);
            setCurrentMeal(initial);
        }
    }, [isOpen, source, selectedTag]);

    const handleNext = () => {
        if (!currentMeal) {
            const initial = getRandomMealFromList(filteredMeals);
            setCurrentMeal(initial);
            return;
        }
        
        if (filteredMeals.length <= 1) return;
        
        setHistory(prev => [...prev, currentMeal]);
        const newMeal = getRandomMealFromList(filteredMeals, currentMeal.id);
        setCurrentMeal(newMeal);
    };

    const handleBack = () => {
        if (history.length === 0) return;
        
        const newHistory = [...history];
        const previousMeal = newHistory.pop()!;
        setHistory(newHistory);
        setCurrentMeal(previousMeal);
    };

    const handleSelect = () => {
        if (!currentMeal) return;
        onSelect(currentMeal);
        onClose();
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="random-meal-title"
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg md:max-w-[calc(100vw-2rem)] lg:max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/80">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <Dices className="w-5 h-5" />
                        </div>
                        <div>
                            <h2
                                id="random-meal-title"
                                className="text-lg font-bold text-gray-900 dark:text-gray-100"
                            >
                                {t('mealplan.randomMeal', 'Slumpa måltid')}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {filteredMeals.length > 0 
                                    ? `${filteredMeals.length} ${t('mealplan.sourceSuggestions', 'förslag matchar')}` 
                                    : t('mealplan.noMealsMatch', 'Inga måltider matchar')}
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

                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                    {/* Source Selection Buttons */}
                    <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl gap-1 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => {
                                setSource('all');
                                setSelectedTag(null);
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                                source === 'all'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        >
                            {t('mealplan.sourceAll', 'Alla')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSource('myMeals');
                                setSelectedTag(null);
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                                source === 'myMeals'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        >
                            <Bookmark className="w-3 h-3" />
                            {t('mealplan.sourceMyMeals', 'Mina favoriter')}
                            {meals.length > 0 && <span>({meals.length})</span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSource('suggestions');
                                setSelectedTag(null);
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                                source === 'suggestions'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        >
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            {t('mealplan.sourceSuggestions', 'Inspiration')}
                        </button>
                    </div>

                    {/* Tag Filter Chips */}
                    {availableTags.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
                            <button
                                type="button"
                                onClick={() => setSelectedTag(null)}
                                className={`px-2.5 py-1 rounded-full font-medium transition-all flex-shrink-0 ${
                                    selectedTag === null
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {t('mealplan.allTags', 'Alla taggar')}
                            </button>
                            {availableTags.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                    className={`px-2.5 py-1 rounded-full font-medium transition-all flex-shrink-0 flex items-center gap-1 ${
                                        selectedTag === tag
                                            ? 'bg-blue-500 text-white shadow-sm'
                                            : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <Tag className="w-2.5 h-2.5" />
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Current Rolled Meal Card */}
                    {currentMeal ? (
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
                            <div className="flex items-start gap-4">
                                {currentMeal.imageUrl ? (
                                    <img
                                        src={currentMeal.imageUrl}
                                        alt={currentMeal.name}
                                        className="w-24 h-24 rounded-xl object-cover flex-shrink-0 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-400 dark:text-gray-500">
                                        <Utensils className="w-10 h-10" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
                                        {currentMeal.name}
                                    </h3>
                                    {currentMeal.description && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                            {currentMeal.description}
                                        </p>
                                    )}
                                    
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                        {currentMeal.ingredients && currentMeal.ingredients.length > 0 && (
                                            <span className="text-[11px] font-medium bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md">
                                                {t('mealplan.ingredientsCount', { count: currentMeal.ingredients.length })}
                                            </span>
                                        )}
                                        {currentMeal.tags && currentMeal.tags.length > 0 && currentMeal.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full"
                                            >
                                                <Tag className="w-2.5 h-2.5" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Preview Recipe Action Button */}
                            {onPreviewRecipe && (currentMeal.ingredients?.length || currentMeal.instructions?.length || currentMeal.description) && (
                                <button
                                    type="button"
                                    onClick={() => onPreviewRecipe(currentMeal)}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                >
                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                    {t('mealplan.previewRecipe', 'Granska ingredienser & recept')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                            <Utensils className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {t('mealplan.noMealsMatch', 'Inga måltider matchar filtren.')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={history.length === 0}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        {t('common.back', 'Tillbaka')}
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={filteredMeals.length <= 1}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Dices className="w-3.5 h-3.5" />
                            {t('mealplan.randomMeal', 'Slumpa ny')}
                        </button>
                        <button
                            type="button"
                            onClick={handleSelect}
                            disabled={!currentMeal}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Check className="w-3.5 h-3.5" />
                            {t('common.select', 'Välj')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

