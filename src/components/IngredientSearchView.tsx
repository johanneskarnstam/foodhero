import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

import { Search, X, Utensils, Eye, Calendar, ShoppingCart, Tag, Users, Dices } from 'lucide-react';
import { Meal, MealType } from '../types';
import { useMealPlan } from '../hooks/useMealPlan';
import { MealDetailModal } from './MealDetailModal';
import { MealEditModal } from './MealEditModal';
import { PlanMealModal } from './PlanMealModal';
import { RandomMealCard } from './RandomMealCard';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';


export const IngredientSearchView: React.FC = () => {
    const { meals, addItemsToList, defaultListId, updateMeal, deleteMeal } = useApp();
    const { t } = useTranslation();
    const { showToast } = useToast();

    const { mealPlans, handleMealChange } = useMealPlan();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [planningMeal, setPlanningMeal] = useState<Meal | null>(null);
    const [showCloseQuestion, setShowCloseQuestion] = useState(false);
    const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [mealSuggestions, setMealSuggestions] = useState<Meal[]>([]);
    const [deleteConfirmMeal, setDeleteConfirmMeal] = useState<Meal | null>(null);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
    const [randomMeals, setRandomMeals] = useState<Meal[]>([]);
    
    // Accessibility refs
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Load meal suggestions asynchronously
    useEffect(() => {
        const loadMealSuggestions = async () => {
            try {
                const suggestions = await import('../data/mealSuggestions.json');
                setMealSuggestions(suggestions.default);
            } catch (error) {
                console.error('Failed to load meal suggestions:', error);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };
        loadMealSuggestions();
    }, []);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Combine meals and mealSuggestions, deduplicated by name
    const allMeals = useMemo(() => {
        const combined: Meal[] = [...meals];
        const existingNames = new Set(meals.map(m => m.name.trim().toLowerCase()));
        mealSuggestions.forEach(s => {
            if (!existingNames.has(s.name.trim().toLowerCase())) {
                combined.push(s);
            }
        });
        return combined;
    }, [meals, mealSuggestions]);

    // Handle saving edited meal
    const handleSaveMeal = async (mealData: Partial<Meal> & { name: string }, mealId?: string) => {
        try {
            if (mealId) {
                await updateMeal(mealId, mealData);
                showToast(t('toasts.itemUpdated', 'Måltid uppdaterad'), 'success');
            }
            setIsEditModalOpen(false);
            setEditingMeal(null);
        } catch {
            showToast(t('toasts.error', 'Ett fel uppstod'), 'error');
        }
    };

    const handleDeleteMeal = (meal: Meal) => {
        setDeleteConfirmMeal(meal);
    };

    const confirmDeleteMeal = async () => {
        if (!deleteConfirmMeal) return;
        
        try {
            await deleteMeal(deleteConfirmMeal.id);
            if (selectedMeal?.id === deleteConfirmMeal.id) setSelectedMeal(null);
            showToast(t('toasts.itemDeleted', 'Måltid borttagen'), 'info');
        } catch {
            showToast(t('toasts.error', 'Ett fel uppstod'), 'error');
        } finally {
            setDeleteConfirmMeal(null);
        }
    };

    // Handle starting edit from detail modal
    const handleStartEdit = (meal: Meal) => {
        setEditingMeal(meal);
        setIsEditModalOpen(true);
        setIsDetailModalOpen(false);
    };

    // Get random meals for display when search is empty
    const getRandomMeals = useCallback((meals: Meal[], count: number = 6): Meal[] => {
        if (meals.length === 0) return [];
        
        // Separate user's own meals and suggestions
        const userMeals = meals.filter(m => m?.id && !m.id.startsWith('sug-'));
        const suggestionMeals = meals.filter(m => m?.id && m.id.startsWith('sug-'));
        
        // Always include a mix of user meals and suggestions if both exist
        if (userMeals.length > 0 && suggestionMeals.length > 0) {
            // Take half user meals and half suggestions (or as close as possible)
            const userCount = Math.ceil(count / 2);
            const suggestionCount = count - userCount;
            
            const shuffledUser = userMeals.sort(() => 0.5 - Math.random()).slice(0, userCount);
            const shuffledSuggestions = suggestionMeals.sort(() => 0.5 - Math.random()).slice(0, suggestionCount);
            
            return [...shuffledUser, ...shuffledSuggestions].sort(() => 0.5 - Math.random());
        }
        
        // If only user meals, use those
        if (userMeals.length > 0) {
            return userMeals.sort(() => 0.5 - Math.random()).slice(0, count);
        }
        
        // If only suggestions, use those
        return suggestionMeals.sort(() => 0.5 - Math.random()).slice(0, count);
    }, []);

    // Update random meals when allMeals changes
    useEffect(() => {
        if (allMeals.length > 0) {
            setRandomMeals(getRandomMeals(allMeals, 6));
        }
    }, [allMeals, getRandomMeals]);

    // Filter meals by ingredient search and calculate match info
    const filteredMealsWithMatches = useMemo(() => {
        const query = debouncedQuery.trim().toLowerCase();

        if (!query) return [];

        return allMeals.map(meal => {
            // Count matching ingredients
            const matchingIngredients = meal.ingredients?.filter(ingredient =>
                ingredient.text.toLowerCase().includes(query)
            ) || [];

            // Check if meal matches search
            const hasIngredient = matchingIngredients.length > 0;
            const hasInName = meal.name.toLowerCase().includes(query);
            const hasInDescription = meal.description?.toLowerCase().includes(query);
            const matchesSearch = hasIngredient || hasInName || hasInDescription;

            return {
                meal,
                matchesSearch,
                matchingIngredients,
                matchCount: matchingIngredients.length
            };
        }).filter(item => item.matchesSearch);
    }, [allMeals, debouncedQuery]);

    const handleClearSearch = () => {
        setSearchQuery('');
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // Keyboard navigation state
    const [focusedResultIndex, setFocusedResultIndex] = useState<number | null>(null);
    const resultRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Keyboard navigation handlers
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Escape key clears search and refocuses input
        if (e.key === 'Escape') {
            if (focusedResultIndex !== null) {
                setFocusedResultIndex(null);
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            } else if (searchQuery) {
                handleClearSearch();
            }
            e.preventDefault();
        }
        
        // Down arrow moves focus to next result or first result
        if (e.key === 'ArrowDown' && filteredMealsWithMatches.length > 0) {
            if (focusedResultIndex === null) {
                setFocusedResultIndex(0);
                if (resultRefs.current[0]) {
                    resultRefs.current[0].focus();
                }
            } else if (focusedResultIndex < filteredMealsWithMatches.length - 1) {
                const nextIndex = focusedResultIndex + 1;
                setFocusedResultIndex(nextIndex);
                if (resultRefs.current[nextIndex]) {
                    resultRefs.current[nextIndex].focus();
                }
            }
            e.preventDefault();
        }
        
        // Up arrow moves focus to previous result or input
        if (e.key === 'ArrowUp') {
            if (focusedResultIndex === null && filteredMealsWithMatches.length > 0) {
                setFocusedResultIndex(filteredMealsWithMatches.length - 1);
                if (resultRefs.current[filteredMealsWithMatches.length - 1]) {
                    resultRefs.current[filteredMealsWithMatches.length - 1]?.focus();
                }
            } else if (focusedResultIndex !== null && focusedResultIndex > 0) {
                const prevIndex = focusedResultIndex - 1;
                setFocusedResultIndex(prevIndex);
                if (resultRefs.current[prevIndex]) {
                    resultRefs.current[prevIndex]?.focus();
                }
            } else if (focusedResultIndex === 0) {
                setFocusedResultIndex(null);
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }
            e.preventDefault();
        }
        
        // Enter key on input: focus first result if available
        if (e.key === 'Enter' && focusedResultIndex === null && filteredMealsWithMatches.length > 0) {
            setFocusedResultIndex(0);
            if (resultRefs.current[0]) {
                resultRefs.current[0].focus();
            }
            e.preventDefault();
        }
    }, [searchQuery, filteredMealsWithMatches.length, focusedResultIndex]);

    // Reset focused index when search query changes
    useEffect(() => {
        setFocusedResultIndex(null);
    }, [debouncedQuery]);

    // Update refs array when results change
    useEffect(() => {
        resultRefs.current = resultRefs.current.slice(0, filteredMealsWithMatches.length);
    }, [filteredMealsWithMatches.length]);

    const handleViewMealDetails = (meal: Meal) => {
        setSelectedMeal(meal);
        setIsDetailModalOpen(true);
    };

    const handleOpenRandomMealDetails = (meal: Meal) => {
        setSelectedMeal(meal);
        setIsDetailModalOpen(true);
    };

    const handleRefreshRandomMeals = () => {
        setRandomMeals(getRandomMeals(allMeals, 6));
    };

    const handlePlanMeal = (meal: Meal) => {
        setPlanningMeal(meal);
        setIsPlanModalOpen(true);
    };

    const handleSavePlannedMeal = (selections: { date: Date; type: MealType }[]) => {
        if (planningMeal) {
            selections.forEach(selection => {
                handleMealChange(selection.date, selection.type, planningMeal.name);
            });
            setIsPlanModalOpen(false);
            setPlanningMeal(null);
        }
    };

    const handlePlanSuccess = () => {
        setShowCloseQuestion(true);
    };



    const handleAddToShoppingList = async (meal: Meal) => {
        if (!defaultListId) return;

        try {
            const itemsToAdd = meal.ingredients?.map(ingredient => ({
                id: uuidv4(),
                text: `${ingredient.amount ? ingredient.amount + ' ' : ''}${ingredient.text}`.trim(),
                completed: false
            })) || [];

            if (itemsToAdd.length > 0) {
                await addItemsToList(defaultListId, itemsToAdd);
            }
        } catch (error) {
            console.error('Failed to add items to shopping list:', error);
        }
    };

    // Handle Enter key on result items
    const handleResultKeyDown = useCallback((
        e: React.KeyboardEvent<HTMLDivElement>,
        _index: number,
        meal: Meal
    ) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleViewMealDetails(meal);
            e.preventDefault();
        }
    }, []);

    // Add missing translation key for clear action
    const clearSearchAriaLabel = t('common.clear', 'Clear search');

    return (
        <div className="space-y-6" role="main" aria-label={t('ingredientSearch.title', 'Search by Ingredient')}>
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        {t('ingredientSearch.title', 'Search by Ingredient')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t('ingredientSearch.subtitle', 'Find recipes containing specific ingredients')}
                    </p>
                </div>
            </header>

            {/* Search Input */}
            <form 
                role="search" 
                aria-label={t('ingredientSearch.title', 'Search by Ingredient')}
                onSubmit={(e) => e.preventDefault()}
                className="relative"
            >
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('ingredientSearch.placeholder', 'Search by ingredient...')}
                    autoFocus
                    aria-label={t('ingredientSearch.placeholder', 'Search by ingredient...')}
                    aria-autocomplete="list"
                    aria-controls="search-results"
                    aria-expanded={filteredMealsWithMatches.length > 0}
                    aria-describedby="results-summary"
                    className="w-full pl-12 pr-12 py-3.5 text-base rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={handleClearSearch}
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                        aria-label={clearSearchAriaLabel}
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                )}
            </form>

            {/* Results Summary */}
            {isLoadingSuggestions && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">
                        {t('common.loading')}
                    </span>
                </div>
            )}
            
            {debouncedQuery && !isLoadingSuggestions && (
                <div 
                    id="results-summary" 
                    className="text-sm text-gray-500 dark:text-gray-400"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {filteredMealsWithMatches.length > 0 
                        ? t('ingredientSearch.foundResults', { count: filteredMealsWithMatches.length })
                        : t('ingredientSearch.noResults', { query: debouncedQuery })}
                </div>
            )}

            {/* Search Results */}
            <div 
                id="search-results" 
                role="listbox"
                aria-label={t('ingredientSearch.title', 'Search by Ingredient')}
                className="space-y-4"
            >
                {filteredMealsWithMatches.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredMealsWithMatches.map(({ meal, matchingIngredients, matchCount }, index) => (
                            <div 
                                key={meal.id}
                                ref={el => { resultRefs.current[index] = el; }}
                                role="option"
                                aria-selected={focusedResultIndex === index}
                                aria-label={`${meal.name}. ${matchCount > 0 ? t('ingredientSearch.matching') + ' ' + matchCount : ''} ${matchingIngredients.length > 0 ? matchingIngredients.map(i => i.text).join(', ') : ''}`}
                                tabIndex={focusedResultIndex === index ? 0 : -1}
                                onKeyDown={(e) => handleResultKeyDown(e, index, meal)}
                                onClick={() => handleViewMealDetails(meal)}
                                onFocus={() => setFocusedResultIndex(index)}
                                onBlur={() => setFocusedResultIndex(null)}
                                className={`bg-white dark:bg-gray-900/70 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs hover:shadow-md hover:border-blue-300/20 dark:hover:border-blue-700/20 transition-all overflow-hidden ${
                                    focusedResultIndex === index 
                                        ? 'ring-2 ring-blue-500 dark:ring-blue-400 outline-none' 
                                        : ''
                                }`}
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                    <div className="flex min-w-0 flex-1 items-start gap-4">
                                        {/* Recipe Icon */}
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                            {meal.imageUrl ? (
                                                <img 
                                                    src={meal.imageUrl} 
                                                    alt={meal.name}
                                                    className="w-10 h-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <Utensils className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            )}
                                        </div>
                                        
                                        {/* Recipe Info */}
                                        <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white break-words">
                                            {meal.name}
                                        </h3>
                                        
                                        {/* Tags */}
                                        {meal.tags && meal.tags.length > 0 && (
                                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                {meal.tags.slice(0, 3).map((tag, index) => (
                                                    <span 
                                                        key={index}
                                                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                                {meal.tags.length > 3 && (
                                                    <span className="text-xs text-gray-400">+{meal.tags.length - 3}</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Match Info & Servings */}
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {matchCount > 0 && (
                                                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium flex items-center gap-1">
                                                    <Tag className="w-3 h-3" />
                                                    {matchCount} {t('ingredientSearch.matching')}
                                                </span>
                                            )}

                                            {meal.servings && (
                                                <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {meal.servings}
                                                </span>
                                            )}
                                        </div>

                                        {/* Matching Ingredients Preview */}
                                        {matchingIngredients.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                                                    {t('ingredientSearch.matching')}:
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 break-words">
                                                    {matchingIngredients.map(i => i.text).join(', ')}
                                                </p>
                                            </div>
                                        )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToShoppingList(meal);
                                            }}
                                            className="flex-1 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors sm:flex-none"
                                            title={t('ingredientSearch.addToShoppingList')}
                                            aria-label={t('ingredientSearch.addToShoppingList')}
                                        >
                                            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlanMeal(meal);
                                            }}
                                            className="flex-1 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors sm:flex-none"
                                            title={t('ingredientSearch.planMeal')}
                                            aria-label={t('ingredientSearch.planMeal')}
                                        >
                                            <Calendar className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewMealDetails(meal);
                                            }}
                                            className="flex-1 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors sm:flex-none"
                                            title={t('ingredientSearch.viewDetails')}
                                            aria-label={t('ingredientSearch.viewDetails')}
                                        >
                                            <Eye className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    debouncedQuery && (
                        <div className="text-center py-12 px-6">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {t('ingredientSearch.noResults', { query: debouncedQuery })}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('ingredientSearch.tryDifferent', 'Try searching for a different ingredient')}
                            </p>
                        </div>
                    )
                )}

                {/* Empty State - No Search */}
                {!debouncedQuery && allMeals.length === 0 && (
                    <div className="text-center py-12 px-6">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <Utensils className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {t('meals.noMeals', 'No recipes yet')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('meals.addFirstRecipe', 'Add your first recipe to start searching by ingredients')}
                        </p>
                    </div>
                )}

                {/* Empty State - No Search but Has Meals - Show Random Recipe Cards */}
                {!debouncedQuery && allMeals.length > 0 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t('ingredientSearch.discoverRecipes', 'Upptäck recept')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {t('ingredientSearch.randomSelection', 'Några slumpmässiga recept för inspiration')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {randomMeals.map(meal => (
                                <RandomMealCard
                                    key={meal.id}
                                    meal={meal}
                                    onClick={() => handleOpenRandomMealDetails(meal)}
                                />
                            ))}
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleRefreshRandomMeals}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                            >
                                <Dices className="w-4 h-4" />
                                {t('ingredientSearch.showOthers', 'Visa andra')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedMeal && (
                <MealDetailModal
                    meal={selectedMeal}
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setShowCloseQuestion(false);
                    }}
                    onEdit={handleStartEdit}
                    onPlanMeal={handlePlanMeal}
                    onAddToShoppingList={handleAddToShoppingList}
                    onDelete={handleDeleteMeal}
                    mealPlans={mealPlans}
                    onPlanSuccess={showCloseQuestion ? () => setShowCloseQuestion(false) : undefined}
                />
            )}

            <ConfirmModal
                isOpen={!!deleteConfirmMeal}
                onClose={() => setDeleteConfirmMeal(null)}
                onConfirm={confirmDeleteMeal}
                title={t('meals.deleteMeal', 'Ta bort måltid')}
                message={t('meals.deleteMealConfirm', 'Är du säker på att du vill ta bort detta recept? Denna åtgärd kan inte ångras.')}
                confirmText={t('common.delete', 'Ta bort')}
                cancelText={t('common.cancel', 'Avbryt')}
                isDestructive={true}
            />

            {editingMeal && (
                <MealEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingMeal(null);
                    }}
                    onSave={handleSaveMeal}
                    meal={editingMeal}
                />
            )}

            {planningMeal && (
                <PlanMealModal
                    isOpen={isPlanModalOpen}
                    onClose={() => {
                        setIsPlanModalOpen(false);
                        setPlanningMeal(null);
                    }}
                    onSave={handleSavePlannedMeal}
                    onAfterSave={handlePlanSuccess}
                    meal={planningMeal}
                    mealPlans={mealPlans}
                />
            )}
        </div>
    );
};