import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, CalendarDays, ArrowRight, CheckCircle2, Circle, UtensilsCrossed, Sparkles, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useMealPlan } from '../hooks/useMealPlan';
import { useToast } from '../context/ToastContext';
import { useAiRecipe } from '../hooks/useAiRecipe';
import { getSuggestedAlternativeModel } from '../services/aiService';
import { formatDate } from '../utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';
import type { List, Item, MealType, HistoryItem, Meal } from '../types';
import { MealPlanEditModal } from './MealPlanEditModal';
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

    // State för måltidsplaneringsmodal
    const [mealPlanModal, setMealPlanModal] = useState<{
        isOpen: boolean;
        date: Date | null;
        type: MealType | null;
    }>({ isOpen: false, date: null, type: null });

    // State för receptmodal
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [showMealDetailModal, setShowMealDetailModal] = useState(false);

    const { uncompletedItems, completedCount, totalCount, previewItems, moreCount } = useMemo(() => {
        if (!list || !list.items) {
            return { uncompletedItems: [], completedCount: 0, totalCount: 0, previewItems: [], moreCount: 0 };
        }
        const total = list.items.length;
        const completed = list.items.filter((i: Item) => i.completed).length;
        const uncompleted = list.items.filter((i: Item) => !i.completed);
        const preview = uncompleted.slice(0, 4);
        const more = Math.max(0, uncompleted.length - 4);

        return {
            uncompletedItems: uncompleted,
            completedCount: completed,
            totalCount: total,
            previewItems: preview,
            moreCount: more,
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

        // Get missing meal types for target date
        const getMissingMealTypes = (d: Date) => {
            const plan = getPlanForDate(d);
            const dateStr = formatDate(d);
            const day = plan?.days.find((dayPlan) => dayPlan.date === dateStr);
            const existingMealTypes = day?.meals.map((m) => m.type) || [];
            const allMealTypes: MealType[] = ['lunch', 'dinner'];
            return allMealTypes.filter((type) => !existingMealTypes.includes(type));
        };

        // Funktion för att hitta fullständigt Meal-objekt baserat på customTitle
        const findMealByTitle = (title: string): Meal | null => {
            if (!title) return null;
            return meals.find(meal => meal.name.toLowerCase() === title.toLowerCase()) || null;
        };

        const missingMealTypes = getMissingMealTypes(targetDate);

        // 1. Kolla targetDate (idag eller imorgon beroende på klockslag)
        const primaryMatch = getMealForDay(targetDate);
        if (primaryMatch) {
            const mealObj = findMealByTitle(primaryMatch.meal.plannedMeal.customTitle || '');
            return {
                hasMeal: true,
                title: primaryMatch.meal.plannedMeal.customTitle,
                label: isTomorrow ? t('dashboard.tomorrowDinner') : t('dashboard.todayDinner'),
                targetDate,
                missingMealTypes,
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
                    missingMealTypes: getMissingMealTypes(tomorrow),
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
                    missingMealTypes: getMissingMealTypes(upcoming),
                    mealId: match.meal.plannedMeal.id,
                    meal: mealObj,
                    mealType: match.mealType,
                };
            }
        }

        return { hasMeal: false, title: '', label: '', targetDate, missingMealTypes, mealId: null, meal: null, mealType: null };
    }, [getPlanForDate, mealPlans, meals, t]);

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {t('dashboard.title', 'Hem')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {t('app.title', 'FoodHero')}
                    </p>
                </div>
            </div>

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

                {/* Progress bar om listan innehåller både klara och oklara varor */}
                {totalCount > 0 && completedCount > 0 && uncompletedItems.length > 0 && (
                    <div className="mb-4">
                        <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                            <span>{completedCount} av {totalCount} klara</span>
                            <span>{Math.round((completedCount / totalCount) * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${(completedCount / totalCount) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Förhandsvisning av varor */}
                {uncompletedItems.length > 0 ? (
                    <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                        {previewItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                                <Circle size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <span className="truncate">{item.text}</span>
                            </div>
                        ))}

                        {/* Indikation om fler varor */}
                        {moreCount > 0 && (
                            <div className="pt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                                {t('dashboard.moreItems', { count: moreCount })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/60 pt-3">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>
                            {totalCount > 0
                                ? t('dashboard.allDone', 'Allt är inhandlat! 🎉')
                                : t('dashboard.emptyList', 'Inköpslistan är tom')}
                        </span>
                    </div>
                )}
                </div>
                
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
                                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Sektion 2: Måltidsplanering */}
            <div className="group relative bg-white dark:bg-gray-800/90 rounded-2xl p-5 md:p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-sm hover:shadow-md hover:border-amber-500/50 dark:hover:border-amber-400/50 transition-all duration-200 text-left">
                <button
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/mealplan')}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate('/mealplan');
                        }
                    }}
                    className="w-full flex items-center justify-between mb-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-lg p-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    aria-label={t('nav.mealplan', 'Matsedel')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                            <CalendarDays size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                {t('dashboard.mealPlanTitle', 'Måltidsplanering')}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {nextMealInfo.hasMeal ? nextMealInfo.label : t('nav.mealplan', 'Matsedel')}
                            </p>
                        </div>
                    </div>

                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all">
                        <ArrowRight size={18} />
                    </div>
                </button>

                {/* Innehåll: Planerad måltid ELLER uppmaning */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60">
                    {nextMealInfo.hasMeal ? (
                        <button
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                if (nextMealInfo.meal) {
                                    setSelectedMeal(nextMealInfo.meal);
                                    setShowMealDetailModal(true);
                                } else {
                                    const tempMeal: Meal = {
                                        id: nextMealInfo.mealId || uuidv4(),
                                        name: nextMealInfo.title || t('meals.unknownMeal'),
                                        createdAt: new Date().toISOString(),
                                    };
                                    setSelectedMeal(tempMeal);
                                    setShowMealDetailModal(true);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (nextMealInfo.meal) {
                                        setSelectedMeal(nextMealInfo.meal);
                                        setShowMealDetailModal(true);
                                    } else {
                                        const tempMeal: Meal = {
                                            id: nextMealInfo.mealId || uuidv4(),
                                            name: nextMealInfo.title || t('meals.unknownMeal'),
                                            createdAt: new Date().toISOString(),
                                        };
                                        setSelectedMeal(tempMeal);
                                        setShowMealDetailModal(true);
                                    }
                                }
                            }}
                            className="w-full flex items-center gap-3 py-1.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-lg p-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex-shrink-0">
                                <UtensilsCrossed size={16} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate block">
                                    {nextMealInfo.title}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {nextMealInfo.label}
                                </span>
                            </div>
                        </button>
                    ) : (
                        <div className="flex flex-col gap-3 py-2">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                <Sparkles size={18} className="text-amber-500 flex-shrink-0" />
                                <span className="text-sm font-medium">
                                    {t('dashboard.noMealsPlannedPrompt', 'Hey, hittar inga planerade måltider, dags att planera matsedeln!')}
                                </span>
                            </div>
                            {nextMealInfo.missingMealTypes.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {nextMealInfo.missingMealTypes.map((type) => {
                                        const isToday = formatDate(nextMealInfo.targetDate) === formatDate(new Date());
                                        const dayLabel = isToday ? t('dashboard.today', 'idag') : t('dashboard.tomorrow', 'imorgon');
                                        return (
                                            <button
                                                key={type}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMealPlanModal({
                                                        isOpen: true,
                                                        date: nextMealInfo.targetDate,
                                                        type: type
                                                    });
                                                }}
                                                className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors"
                                            >
                                                + {t(`mealTypes.${type}`, type)} {dayLabel}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <MealPlanEditModal
                isOpen={mealPlanModal.isOpen}
                onClose={() => setMealPlanModal({ isOpen: false, date: null, type: null })}
                initialValue=""
                meals={meals}
                mealPlans={mealPlans}
                onSave={async (mealName) => {
                    if (mealPlanModal.date && mealPlanModal.type) {
                        await handleMealChange(
                            mealPlanModal.date,
                            mealPlanModal.type,
                            mealName
                        );
                    }
                    setMealPlanModal({ isOpen: false, date: null, type: null });
                }}
            />

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
