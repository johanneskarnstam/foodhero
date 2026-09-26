import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, ArrowRight, CheckCircle2, Circle, ChevronDown, UtensilsCrossed, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useMealPlan } from '../hooks/useMealPlan';
import { useToast } from '../context/ToastContext';
import { useAiRecipe } from '../hooks/useAiRecipe';
import { getSuggestedAlternativeModel } from '../services/aiService';
import { formatDate } from '../utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';
import type { List, Item, HistoryItem, Meal } from '../types';
import { MealDetailModal } from './MealDetailModal';

export const HomeView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lists, defaultListId, addItemsToList, itemHistory, meals, updateMeal } = useApp();
    const { getPlanForDate, mealPlans, handleMealChange } = useMealPlan();
    const { showToast } = useToast();
    const { enrichMeal, isLoading: isAiEnriching } = useAiRecipe();

    // State för snabbaddition
    const [quickAddText, setQuickAddText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<HistoryItem[]>([]);

    // 1. Inköpslista sammanfattning
    const list: List | undefined = useMemo(() => {
        return lists.find((l) => l.id === defaultListId);
    }, [lists, defaultListId]);

    // Autocomplete-logik för snabbaddition
    useEffect(() => {
        if (!quickAddText.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const searchText = quickAddText.toLowerCase();
        const matches = itemHistory
            .filter(h => h.text.toLowerCase().includes(searchText))
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 5);

        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
    }, [quickAddText, itemHistory]);

    // Funktion för att lägga till vara via snabbaddition
    const handleQuickAdd = async (e?: React.FormEvent, textOverride?: string) => {
        if (e) e.preventDefault();
        const rawText = (textOverride || quickAddText).trim();

        // Validering: Förhindra tomma varor
        if (!defaultListId || !rawText) {
            showToast(t('errors.emptyItem', 'Du måste ange en vara'), 'error');
            return;
        }

        const newItem: Item = {
            id: uuidv4(),
            text: rawText,
            completed: false,
        };

        try {
            await addItemsToList(defaultListId, [newItem]);
            setQuickAddText('');
            setShowSuggestions(false);
            showToast(t('dashboard.itemAdded', 'Varan lades till i inköpslistan'), 'success');
        } catch {
            showToast(t('errors.failedToAddItem', 'Misslyckades att lägga till varan'), 'error');
        }
    };

    // Funktion för att rensa input-fältet
    const handleClearInput = () => {
        setQuickAddText('');
        setShowSuggestions(false);
    };

    // State för receptmodal
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [showMealDetailModal, setShowMealDetailModal] = useState(false);
    const [completedItemsExpanded, setCompletedItemsExpanded] = useState(false);

    const { uncompletedItems, completedItems, totalCount } = useMemo(() => {
        if (!list || !list.items) {
            return { uncompletedItems: [], completedItems: [], completedCount: 0, totalCount: 0 };
        }
        const total = list.items.length;
        const uncompleted = list.items.filter((i: Item) => !i.completed);
        const completedItems = list.items.filter((i: Item) => i.completed);
        return {
            uncompletedItems: uncompleted,
            completedItems,
            totalCount: total,
        };
    }, [list]);

    // 2. Måltidsplanering sammanfattning
    const nextMealInfo = useMemo(() => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const isAfterEveningCutoff = hour > 19 || (hour === 19 && minute >= 30);

        const targetDate = new Date(now);
        let isTomorrow = false;

        if (isAfterEveningCutoff) {
            targetDate.setDate(targetDate.getDate() + 1);
            isTomorrow = true;
        }

        const getMealForDay = (d: Date) => {
            const plan = getPlanForDate(d);
            if (!plan) return null;
            const dateStr = formatDate(d);
            const day = plan.days.find((dayPlan) => dayPlan.date === dateStr);
            if (!day || !day.meals || day.meals.length === 0) return null;

            // Prioritera middag om det finns, annars lunch, annars första
            const dinner = day.meals.find((m) => m.type === 'dinner');
            if (dinner && dinner.plannedMeal?.customTitle?.trim()) {
                return { meal: dinner, mealType: 'dinner' as const };
            }
            const lunch = day.meals.find((m) => m.type === 'lunch');
            if (lunch && lunch.plannedMeal?.customTitle?.trim()) {
                return { meal: lunch, mealType: 'lunch' as const };
            }
            const anyMeal = day.meals.find((m) => m.plannedMeal?.customTitle?.trim());
            if (anyMeal) {
                return { meal: anyMeal, mealType: anyMeal.type };
            }
            return null;
        };

        // Funktion för att hitta fullständigt Meal-objekt baserat på customTitle
        const findMealByTitle = (title: string): Meal | null => {
            if (!title) return null;
            return meals.find(meal => meal.name.toLowerCase() === title.toLowerCase()) || null;
        };

        // 1. Kolla targetDate (idag eller imorgon beroende på klockslag)
        const primaryMatch = getMealForDay(targetDate);
        if (primaryMatch) {
            const mealObj = findMealByTitle(primaryMatch.meal.plannedMeal.customTitle || '');
            return {
                hasMeal: true,
                title: primaryMatch.meal.plannedMeal.customTitle,
                label: isTomorrow ? t('dashboard.tomorrowDinner') : t('dashboard.todayDinner'),
                targetDate,
                mealId: primaryMatch.meal.plannedMeal.id,
                meal: mealObj,
                mealType: primaryMatch.mealType,
            };
        }

        // 2. Om targetDate var idag men saknade måltid, kolla imorgon
        if (!isTomorrow) {
            const tomorrow = new Date(targetDate);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowMatch = getMealForDay(tomorrow);
            if (tomorrowMatch) {
                const mealObj = findMealByTitle(tomorrowMatch.meal.plannedMeal.customTitle || '');
                return {
                    hasMeal: true,
                    title: tomorrowMatch.meal.plannedMeal.customTitle,
                    label: t('dashboard.tomorrowDinner'),
                    targetDate: tomorrow,
                    mealId: tomorrowMatch.meal.plannedMeal.id,
                    meal: mealObj,
                    mealType: tomorrowMatch.mealType,
                };
            }
        }

        // 3. Kolla resten av aktuell vecka (upp till 5 dagar framåt)
        for (let offset = 2; offset <= 6; offset++) {
            const upcoming = new Date(now);
            upcoming.setDate(now.getDate() + offset);
            const match = getMealForDay(upcoming);
            if (match) {
                const dayName = upcoming.toLocaleDateString(undefined, { weekday: 'long' });
                const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                const mealObj = findMealByTitle(match.meal.plannedMeal.customTitle || '');
                return {
                    hasMeal: true,
                    title: match.meal.plannedMeal.customTitle,
                    label: `${capitalizedDay} - ${t('dashboard.nextMeal')}`,
                    targetDate: upcoming,
                    mealId: match.meal.plannedMeal.id,
                    meal: mealObj,
                    mealType: match.mealType,
                };
            }
        }

        return { hasMeal: false, title: '', label: '', targetDate, mealId: null, meal: null, mealType: null };
    }, [getPlanForDate, mealPlans, meals, t]);

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-6">
            <section className="flex items-center gap-4 rounded-xl bg-blue-600 px-5 py-4 text-white shadow-sm">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UtensilsCrossed size={21} className="shrink-0 text-blue-100" />
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-blue-100">
                            {nextMealInfo.hasMeal ? nextMealInfo.label : t('dashboard.nextMeal', 'Nästa måltid')}
                        </p>
                        {nextMealInfo.hasMeal ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (nextMealInfo.meal) {
                                        setSelectedMeal(nextMealInfo.meal);
                                    } else {
                                        setSelectedMeal({
                                            id: nextMealInfo.mealId || uuidv4(),
                                            name: nextMealInfo.title || t('meals.unknownMeal'),
                                            createdAt: new Date().toISOString(),
                                        });
                                    }
                                    setShowMealDetailModal(true);
                                }}
                                className="block max-w-full truncate text-left text-lg font-semibold text-white hover:underline focus:outline-none focus:ring-2 focus:ring-white"
                            >
                                {nextMealInfo.title}
                            </button>
                        ) : (
                            <p className="text-sm font-semibold">
                                {t('dashboard.noMealsPlannedPrompt', 'Ingen måltid planerad')}
                            </p>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/mealplan')}
                    aria-label={t('nav.mealplan', 'Matsedel')}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white"
                >
                    <ArrowRight size={20} />
                </button>
            </section>

            {/* Sektion 1: Inköpslista med integrerat snabbfält */}
            <div className="bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm overflow-hidden">
                {/* Klickbar del för inköpslistan */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/shopping')}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate('/shopping');
                        }
                    }}
                    className="group relative p-5 md:p-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                    {/* Kortrubrik och räknare */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                            <ShoppingCart size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {t('dashboard.shoppingTitle', 'Inköpslista')}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {totalCount > 0 && uncompletedItems.length === 0
                                    ? t('dashboard.allDone', 'Allt är inhandlat! 🎉')
                                    : t('dashboard.itemsLeft', { count: uncompletedItems.length })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {uncompletedItems.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                {uncompletedItems.length}
                            </span>
                        )}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
                            <ArrowRight size={18} />
                        </div>
                    </div>
                </div>

                {/* Förhandsvisning av varor */}
                {uncompletedItems.length > 0 ? (
                    <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                        {uncompletedItems.map((item) => (
                            <div key={item.id} data-testid="home-shopping-item" className="flex min-h-9 items-center gap-3 py-1 text-base text-gray-700 dark:text-gray-300">
                                <Circle size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <span className="truncate">{item.text}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/60 pt-3">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>{totalCount > 0
                            ? t('dashboard.allDone', 'Allt är inhandlat! 🎉')
                            : t('dashboard.emptyList', 'Inköpslistan är tom')}</span>
                    </div>
                )}
                </div>

                {completedItems.length > 0 && (
                    <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-700/60">
                        <button
                            type="button"
                            onClick={() => setCompletedItemsExpanded((expanded) => !expanded)}
                            aria-expanded={completedItemsExpanded}
                            aria-controls="home-completed-items"
                            className="flex w-full items-center gap-2 py-1 text-left text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <ChevronDown size={16} className={`transition-transform ${completedItemsExpanded ? 'rotate-180' : ''}`} />
                            <span>{t('lists.completedItems', 'Handlade varor')} ({completedItems.length})</span>
                        </button>
                        {completedItemsExpanded && (
                            <div id="home-completed-items" className="space-y-2 pb-1 pt-2">
                                {completedItems.map((item) => (
                                    <div key={item.id} data-testid="home-completed-item" className="flex min-h-9 items-center gap-3 py-1 text-base text-gray-400 dark:text-gray-500">
                                        <CheckCircle2 size={17} className="flex-shrink-0 text-emerald-500" />
                                        <span className="truncate line-through">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Snabbaddition - integrerat i inköpslistans container */}
                <div className="border-t border-gray-200/80 dark:border-gray-700/80 p-4">
                    <form onSubmit={handleQuickAdd} className="flex gap-2">
                        <div className="flex-1 relative">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={quickAddText}
                                    onChange={(e) => setQuickAddText(e.target.value)}
                                    onFocus={() => quickAddText.trim() && setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    placeholder={t('dashboard.quickAddPlaceholder', 'Lägg till matvara...')}
                                    aria-label={t('dashboard.quickAddPlaceholder', 'Lägg till matvara...')}
                                    className="min-h-11 flex-1 px-4 py-2.5 text-base bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {quickAddText && (
                                    <button
                                        type="button"
                                        onClick={handleClearInput}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        aria-label={t('common.clear', 'Rensa')}
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-40 overflow-y-auto py-1">
                                    {suggestions.map((suggestion) => (
                                        <li
                                            key={suggestion.id}
                                            onClick={() => {
                                                setQuickAddText(suggestion.text);
                                                handleQuickAdd(undefined, suggestion.text);
                                            }}
                                            className="px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white transition-colors"
                                        >
                                            {suggestion.text}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                            aria-label={t('dashboard.quickAddButton', 'Lägg till')}
                        >
                            <Plus size={18} />
                        </button>
                    </form>
                </div>
            </div>

            <MealDetailModal
                isOpen={showMealDetailModal}
                onClose={() => setShowMealDetailModal(false)}
                meal={selectedMeal}
                mealPlans={mealPlans}
                onEdit={() => {
                    // Hantera redigering av måltid
                    navigate('/meals');
                }}
                onPlanMeal={(meal) => {
                    // Hantera planering av måltid
                    if (nextMealInfo.targetDate && nextMealInfo.mealType) {
                        handleMealChange(nextMealInfo.targetDate, nextMealInfo.mealType, meal.name);
                    }
                }}
                onAddToShoppingList={(meal) => {
                    // Hantera lägg till i inköpslistan
                    if (!defaultListId) return;
                    if (meal.ingredients && meal.ingredients.length > 0) {
                        const newItems: Item[] = meal.ingredients.map(ing => ({
                            id: uuidv4(),
                            text: ing.text,
                            completed: false,
                        }));
                        addItemsToList(defaultListId, newItems);
                        showToast(t('meals.addedToShoppingList'), 'success');
                    }
                }}
                isAiLoading={isAiEnriching}
                onFetchAIRecipe={async (meal) => {
                    try {
                        const enrichedRecipe = await enrichMeal(meal);
                        if (enrichedRecipe) {
                            const updates: Partial<Meal> = {
                                ingredients: enrichedRecipe.ingredients.map(ing => ({
                                    text: ing.text,
                                    amount: ing.amount,
                                    checkIfExistAtHome: false,
                                })),
                                instructions: enrichedRecipe.instructions,
                                description: enrichedRecipe.description || meal.description,
                                servings: enrichedRecipe.servings || meal.servings || 4,
                                tags: enrichedRecipe.tags && enrichedRecipe.tags.length > 0 ? enrichedRecipe.tags : (meal.tags || []),
                            };
                            await updateMeal(meal.id, updates);
                            setSelectedMeal({
                                ...meal,
                                ...updates,
                            });
                            showToast(t('meals.recipeFetchedWithAI'), 'success');
                        } else {
                            const suggested = getSuggestedAlternativeModel();
                            showToast(t('ai.enrichFailedWithSuggestion', `Kunde inte komplettera receptet med AI. Förslag: Byt till ${suggested.name} i Inställningar.`, { model: suggested.name }), 'error');
                        }
                    } catch (err) {
                        console.error('Failed to enrich recipe with AI:', err);
                        const suggested = getSuggestedAlternativeModel();
                        showToast(t('ai.enrichFailedWithSuggestion', `Kunde inte komplettera receptet med AI. Förslag: Byt till ${suggested.name} i Inställningar.`, { model: suggested.name }), 'error');
                    }
                }}
            />

        </div>
    );
};
