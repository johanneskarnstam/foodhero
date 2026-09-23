import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { MealPlanEditModal } from './MealPlanEditModal';
import { RandomMealModal } from './RandomMealModal';
import { IngredientSelectionModal, PlannedMealWithIngredients } from './IngredientSelectionModal';
import { MealType, Item, Meal } from '../types';
import { 
    ChevronLeft, 
    ChevronRight, 
    Utensils, 
    CalendarDays, 
    Download, 
    Heart, 
    ShoppingCart, 
    BookOpen, 
    AlertCircle, 
    Calendar, 
    Dices,
    Trash2,
    Search
} from 'lucide-react';
import { useMealPlan } from '../hooks/useMealPlan';
import { RecipeDetailModal } from './RecipeDetailModal';
import { ConfirmModal } from './ConfirmModal';
import { exportMealPlanToICS } from '../utils/calendarUtils';
import { v4 as uuidv4 } from 'uuid';
import { getISOWeek, formatDate, getDayName } from '../utils/dateUtils';

export const MealPlanView: React.FC = () => {
    const { 
        mealPlans, 
        meals, 
        getMealText, 
        handleMealChange, 
        handleSaveToLibrary,
        copyPreviousWeek
    } = useMealPlan();
    
    const { showToast } = useToast();
    const { t } = useTranslation();
    const { addItemsToList, defaultListId, deleteMeal } = useApp();
    const navigate = useNavigate();
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [ingredientModalConfig, setIngredientModalConfig] = useState<{
        isOpen: boolean;
        title?: string;
        subtitle?: string;
        plannedMeals: PlannedMealWithIngredients[];
    }>({
        isOpen: false,
        plannedMeals: []
    });
    const [recipeViewMeal, setRecipeViewMeal] = useState<Meal | null>(null);
    const [modalSlot, setModalSlot] = useState<{ date: Date; type: MealType } | null>(null);
    const [deleteConfirmMeal, setDeleteConfirmMeal] = useState<Meal | null>(null);
    const [promptSaveMealName, setPromptSaveMealName] = useState<string | null>(null);
    const [randomMealModal, setRandomMealModal] = useState<{ isOpen: boolean; date: Date | null; type: MealType | null }>({
        isOpen: false,
        date: null,
        type: null
    });
    const [mealSuggestions, setMealSuggestions] = useState<Meal[]>([]);

    // Load meal suggestions asynchronously
    useEffect(() => {
        const loadMealSuggestions = async () => {
            try {
                const suggestions = await import('../data/mealSuggestions.json');
                setMealSuggestions(suggestions.default);
            } catch (error) {
                console.error('Failed to load meal suggestions:', error);
            }
        };
        loadMealSuggestions();
    }, []);

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const navigateDays = (direction: 'prev' | 'next') => {
        const newDate = new Date(startDate);
        newDate.setDate(startDate.getDate() + (direction === 'prev' ? -10 : 10));
        setStartDate(newDate);
    };

    const resetToToday = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        setStartDate(d);
    };

    const displayDays = useMemo(() => {
        return Array.from({ length: 10 }).map((_, i) => {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            return d;
        });
    }, [startDate]);

    const mealCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        displayDays.forEach(date => {
            ['lunch', 'dinner'].forEach(type => {
                const text = getMealText(date, type as MealType).trim().toLowerCase();
                if (text) {
                    counts[text] = (counts[text] || 0) + 1;
                }
            });
        });
        return counts;
    }, [displayDays, getMealText]);

    const onSaveToLibraryWrapper = async (text: string) => {
        const success = await handleSaveToLibrary(text);
        if (success) {
            showToast(t('mealplan.savedToFavorites', 'Måltid sparad till favoriter'), 'success');
        }
    };

    const handleClearMeal = async (date: Date, type: MealType) => {
        await handleMealChange(date, type, '');
        showToast(t('toasts.mealDeleted', 'Måltid borttagen'), 'info');
    };

    const handleDeleteMeal = (meal: Meal) => {
        setDeleteConfirmMeal(meal);
    };

    const confirmDeleteMeal = async () => {
        if (!deleteConfirmMeal) return;
        
        try {
            await deleteMeal(deleteConfirmMeal.id);
            if (recipeViewMeal?.id === deleteConfirmMeal.id) setRecipeViewMeal(null);
            showToast(t('toasts.itemDeleted', 'Måltid borttagen'), 'info');
        } catch {
            showToast(t('toasts.error', 'Ett fel uppstod'), 'error');
        } finally {
            setDeleteConfirmMeal(null);
        }
    };

    const handleViewRecipe = (mealText: string) => {
        const meal = meals.find(m => m.name.toLowerCase() === mealText.toLowerCase());
        if (meal) {
            setRecipeViewMeal(meal);
        }
    };

    const handleRandomMealSelect = (meal: Meal) => {
        if (randomMealModal.date && randomMealModal.type) {
            handleMealChange(randomMealModal.date, randomMealModal.type, meal.name);
            showToast(t('toasts.mealPlanned'), 'success');
        }
        setRandomMealModal({ isOpen: false, date: null, type: null });
    };

    const resolveMealIngredients = (mealText: string): PlannedMealWithIngredients => {
        const trimmed = mealText.trim();
        const foundMeal = meals.find(m => m.name.toLowerCase() === trimmed.toLowerCase())
            || mealSuggestions.find(m => m.name.toLowerCase() === trimmed.toLowerCase());
        
        return {
            name: trimmed,
            ingredients: foundMeal?.ingredients || []
        };
    };

    const handleAddDayIngredientsToList = (date: Date) => {
        if (!defaultListId) {
            showToast(t('errors.noList', 'Kunde inte hitta inköpslistan'), 'error');
            return;
        }

        const dayMeals = ['lunch', 'dinner'] as const;
        const planned: PlannedMealWithIngredients[] = [];

        dayMeals.forEach(type => {
            const mealText = getMealText(date, type).trim();
            if (mealText) {
                planned.push(resolveMealIngredients(mealText));
            }
        });

        if (planned.length === 0) {
            showToast(t('toasts.allAtHome', 'Inga ingredienser att lägga till'), 'info');
            return;
        }

        const dateString = date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' });
        setIngredientModalConfig({
            isOpen: true,
            title: `${t('views.ingredients', 'Ingredienser')} – ${dateString}`,
            plannedMeals: planned
        });
    };

    const handleGenerateWeeklyList = () => {
        if (!defaultListId) {
            showToast(t('errors.noList', 'Kunde inte hitta inköpslistan'), 'error');
            return;
        }

        const dayMeals = ['lunch', 'dinner'] as const;
        const planned: PlannedMealWithIngredients[] = [];

        displayDays.forEach(date => {
            dayMeals.forEach(type => {
                const mealText = getMealText(date, type).trim();
                if (mealText) {
                    planned.push(resolveMealIngredients(mealText));
                }
            });
        });

        if (planned.length === 0) {
            showToast(t('toasts.allAtHome', 'Inga måltider planerade för veckan'), 'info');
            return;
        }

        setIngredientModalConfig({
            isOpen: true,
            title: t('mealplan.generateList', 'Skapa inköpslista för veckan'),
            plannedMeals: planned
        });
    };

    const handleConfirmTransferIngredients = async (items: { text: string; amount?: string }[]) => {
        if (!defaultListId) {
            showToast(t('errors.noList', 'Kunde inte hitta inköpslistan'), 'error');
            return;
        }

        const itemsToAdd: Item[] = items.map(item => ({
            id: uuidv4(),
            text: `${item.amount ? item.amount + ' ' : ''}${item.text}`.trim(),
            completed: false
        }));

        if (itemsToAdd.length === 0) {
            showToast(t('toasts.allAtHome', 'Inga ingredienser valda'), 'info');
            return;
        }

        try {
            await addItemsToList(defaultListId, itemsToAdd);
            showToast(`${itemsToAdd.length} ${t('common.items', 'artiklar')} tillagda i inköpslistan`, 'success');
        } catch {
            showToast(t('toasts.error', 'Ett fel uppstod'), 'error');
        }
    };

    const handleCopyPreviousWeek = async () => {
        const success = await copyPreviousWeek(startDate);
        if (success) {
            showToast(t('toasts.weekCopied', 'Förra veckans plan kopierad'), 'success');
        } else {
            showToast(t('toasts.noPrevWeek', 'Hittade ingen plan för förra veckan'), 'info');
        }
    };

    const handleExportToCalendar = () => {
        const exportData = displayDays.map(date => ({
            date,
            lunch: getMealText(date, 'lunch'),
            dinner: getMealText(date, 'dinner')
        }));

        const icsContent = exportMealPlanToICS(exportData);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `mealplan-${formatDate(startDate)}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showToast(t('toasts.calendarExported', 'Måltidsplan exporterad till kalender'), 'success');
    };

    let lastRenderedWeekNumber = -1;

    const exportJSON = useMemo(() => {
        if (!isExportOpen) return '';
        const exportData = displayDays.map(date => {
            return {
                date: formatDate(date),
                day: getDayName(date, t),
                lunch: getMealText(date, 'lunch'),
                dinner: getMealText(date, 'dinner')
            };
        });
        return JSON.stringify({
            exportDate: new Date().toISOString().split('T')[0],
            mealPlan: exportData
        }, null, 2);
    }, [isExportOpen, displayDays, mealPlans, getMealText]);

    const renderMealSlot = (date: Date, type: 'lunch' | 'dinner') => {
        const isLunch = type === 'lunch';
        const mealText = getMealText(date, type);
        const isDuplicate = mealText ? mealCounts[mealText.toLowerCase()] > 1 : false;
        const meal = mealText ? meals.find(m => m.name.toLowerCase() === mealText.toLowerCase()) : undefined;
        const isSaved = !!meal;

        const themeStyles = isLunch
            ? {
                badge: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40',
                emptyCard: 'border-dashed border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 hover:border-emerald-400 dark:hover:border-emerald-600',
                filledCard: 'border-emerald-200/80 dark:border-emerald-800/60 bg-white dark:bg-gray-800 hover:border-emerald-400 dark:hover:border-emerald-500',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                label: t('mealplan.lunch', 'Lunch'),
            }
            : {
                badge: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40',
                emptyCard: 'border-dashed border-blue-200/80 dark:border-blue-800/50 bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 hover:border-blue-400 dark:hover:border-blue-600',
                filledCard: 'border-blue-200/80 dark:border-blue-800/60 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500',
                iconColor: 'text-blue-600 dark:text-blue-400',
                label: t('mealplan.dinner', 'Middag'),
            };

        return (
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center justify-between px-1">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-md border ${themeStyles.badge}`}>
                        <Utensils className="w-3 h-3" />
                        {themeStyles.label}
                    </span>
                </div>

                {!mealText ? (
                    <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${themeStyles.emptyCard}`}>
                        <button
                            onClick={() => setModalSlot({ date, type })}
                            className="flex-1 text-left text-sm font-medium text-gray-400 dark:text-gray-500 italic hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-0.5"
                        >
                            {t('mealplan.whatToEat', 'Vad ska ätas?')}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setRandomMealModal({ isOpen: true, date, type });
                            }}
                            className={`p-1.5 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800 transition-colors ${themeStyles.iconColor}`}
                            title={t('mealplan.randomMeal', 'Slumpa måltid')}
                        >
                            <Dices className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className={`flex items-center justify-between p-2.5 rounded-xl border shadow-sm transition-all group ${themeStyles.filledCard}`}>
                        <button
                            onClick={() => setModalSlot({ date, type })}
                            className="flex-1 text-left min-w-0 pr-2"
                        >
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-sm font-semibold truncate ${
                                    isDuplicate 
                                        ? 'text-amber-600 dark:text-amber-400' 
                                        : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                    {mealText}
                                </span>
                                {isDuplicate && (
                                    <span title={t('mealplan.duplicateWarning', 'Måltiden förekommer flera gånger denna vecka')}>
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                    </span>
                                )}
                            </div>
                        </button>

                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={() => onSaveToLibraryWrapper(mealText)}
                                disabled={isSaved}
                                className={`p-1.5 rounded-lg transition-colors ${
                                    isSaved 
                                        ? 'text-red-500 bg-red-50 dark:bg-red-950/30' 
                                        : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                title={isSaved ? t('mealplan.savedToFavorites', 'Redan sparad') : t('mealplan.saveToFavorites', 'Spara till favoriter')}
                            >
                                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                            </button>
                            {isSaved && (
                                <button
                                    onClick={() => handleViewRecipe(mealText)}
                                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                    title={t('mealplan.viewRecipe', 'Visa recept')}
                                >
                                    <BookOpen className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearMeal(date, type);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                title={t('mealplan.deleteMeal', 'Ta bort måltid')}
                                aria-label={t('mealplan.deleteMeal', 'Ta bort måltid')}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4 sm:px-6">
            {/* Header & Tools Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        {t('mealplan.title', 'Måltidsschema')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {t('mealplan.rollingView', 'Rullande 7-dagarsvy')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Navigation Controls */}
                    <div className="inline-flex items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700/60">
                        <button 
                            onClick={() => navigateDays('prev')}
                            className="p-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition-all"
                            title={t('mealplan.navigateBack', 'Backa 10 dagar')}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={resetToToday}
                            className="px-3 py-1 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition-all"
                        >
                            {t('mealplan.today', 'Idag')}
                        </button>
                        <button 
                            onClick={() => navigateDays('next')}
                            className="p-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition-all"
                            title={t('mealplan.navigateForward', 'Framåt 10 dagar')}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => navigate('/ingredients')}
                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors"
                            title={t('meals.searchByIngredient', 'Sök på ingrediens')}
                        >
                            <Search className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={handleCopyPreviousWeek}
                            className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/40 transition-colors"
                            title={t('mealplan.copyWeek', 'Kopiera förra veckan')}
                        >
                            <CalendarDays className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={handleGenerateWeeklyList}
                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors cursor-pointer"
                            title={t('mealplan.generateList', 'Generera veckans inköpslista')}
                        >
                            <ShoppingCart className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={handleExportToCalendar}
                            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800/40 transition-colors"
                            title={t('mealplan.exportCalendar', 'Exportera till kalender (.ics)')}
                        >
                            <Calendar className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setIsExportOpen(true)}
                            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
                            title={t('mealplan.exportJson', 'Exportera till JSON')}
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Days List */}
            <div className="flex flex-col gap-4">
                {displayDays.map((date) => {
                    const { weekNumber } = getISOWeek(date);
                    const showWeekHeader = weekNumber !== lastRenderedWeekNumber;
                    lastRenderedWeekNumber = weekNumber;
                    
                    const isToday = formatDate(date) === formatDate(new Date());
                    const dateString = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });

                    return (
                        <React.Fragment key={date.toISOString()}>
                            {showWeekHeader && (
                                <div className="mt-4 mb-1 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm tracking-wide uppercase px-1">
                                    <CalendarDays className="w-4 h-4" />
                                    <span>{t('mealplan.weekInfo', `Vecka ${weekNumber}`, { weekNumber })}</span>
                                    <div className="flex-1 h-px bg-blue-100 dark:bg-blue-900/40 ml-2" />
                                </div>
                            )}

                            <div className={`p-4 rounded-2xl border transition-all duration-200 ${
                                isToday 
                                    ? 'border-blue-400/90 dark:border-blue-500/80 bg-blue-50/20 dark:bg-blue-950/20 ring-1 ring-blue-400/50 dark:ring-blue-500/50 shadow-xs' 
                                    : 'border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs hover:border-gray-300 dark:hover:border-gray-700'
                            }`}>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                                    {/* Left: Day & Date Header */}
                                    <div className="md:col-span-3 flex md:flex-col justify-between md:justify-center items-center md:items-start border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 pb-3 md:pb-0 md:pr-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                                                    {getDayName(date, t)}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                {dateString}
                                            </p>
                                        </div>

                                        <button 
                                            onClick={() => handleAddDayIngredientsToList(date)}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors cursor-pointer"
                                            title="Lägg till dagens ingredienser i inköpslistan"
                                        >
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                            <span>{t('mealplan.dayList', 'Lista')}</span>
                                        </button>
                                    </div>

                                    {/* Right: Lunch and Dinner Cards */}
                                    <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {renderMealSlot(date, 'lunch')}
                                        {renderMealSlot(date, 'dinner')}
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Modals */}
            <Modal
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                title={t('mealplan.exportTitle', 'Exportera Måltidsplan')}
                message={t('mealplan.exportMessage', 'Här är din måltidsplan för de valda dagarna i JSON-format. Du kan enkelt kopiera detta och använda i andra appar.')}
                confirmText={t('mealplan.copiedToClipboard', 'Kopiera till urklipp')}
                onConfirm={() => {
                    navigator.clipboard.writeText(exportJSON);
                    showToast(t('mealplan.copiedToClipboard', 'JSON kopierad till urklipp'), 'success');
                }}
            >
                <div className="relative">
                    <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto custom-scrollbar">
                        {exportJSON}
                    </pre>
                </div>
            </Modal>

            <IngredientSelectionModal
                isOpen={ingredientModalConfig.isOpen}
                onClose={() => setIngredientModalConfig({ isOpen: false, plannedMeals: [] })}
                title={ingredientModalConfig.title}
                subtitle={ingredientModalConfig.subtitle}
                plannedMeals={ingredientModalConfig.plannedMeals}
                onConfirm={handleConfirmTransferIngredients}
            />

            <MealPlanEditModal
                isOpen={!!modalSlot}
                onClose={() => setModalSlot(null)}
                initialValue={modalSlot ? getMealText(modalSlot.date, modalSlot.type) : ''}
                meals={meals}
                mealSuggestions={mealSuggestions}
                mealPlans={mealPlans}
                onPreviewRecipe={(meal) => setRecipeViewMeal(meal)}
                onSave={async (mealName) => {
                    if (modalSlot) {
                        const targetDate = modalSlot.date;
                        const targetType = modalSlot.type;
                        const trimmed = mealName.trim();
                        await handleMealChange(targetDate, targetType, trimmed);
                        setModalSlot(null);

                        if (trimmed) {
                            const exists = meals.some(m => m.name.trim().toLowerCase() === trimmed.toLowerCase());
                            if (!exists) {
                                setPromptSaveMealName(trimmed);
                            }
                        }
                    }
                }}
            />

            <Modal
                isOpen={!!promptSaveMealName}
                onClose={() => setPromptSaveMealName(null)}
                title={t('mealplan.saveNewMealTitle', 'Spara som ny måltid?')}
                message={t('mealplan.saveNewMealPrompt', `Vill du även spara "${promptSaveMealName}" bland dina måltider?`, { mealName: promptSaveMealName })}
                confirmText={t('common.save', 'Spara')}
                cancelText={t('common.cancel', 'Avbryt')}
                onConfirm={async () => {
                    if (promptSaveMealName) {
                        await onSaveToLibraryWrapper(promptSaveMealName);
                    }
                    setPromptSaveMealName(null);
                }}
            />

            <RecipeDetailModal 
                isOpen={!!recipeViewMeal} 
                onClose={() => setRecipeViewMeal(null)} 
                onTagClick={(tag) => {
                    setRecipeViewMeal(null);
                    navigate(`/meals?tag=${encodeURIComponent(tag)}`);
                }}
                onDelete={handleDeleteMeal}
                meal={recipeViewMeal} 
            />

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

            <RandomMealModal
                isOpen={randomMealModal.isOpen}
                onClose={() => setRandomMealModal({ isOpen: false, date: null, type: null })}
                onSelect={handleRandomMealSelect}
                meals={meals}
                mealSuggestions={mealSuggestions}
                onPreviewRecipe={(meal) => setRecipeViewMeal(meal)}
            />
        </div>
    );
};
