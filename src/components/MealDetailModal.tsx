import React, { useState, useMemo, useEffect } from 'react';
import { 
    X, 
    Utensils, 
    Tag, 
    BookOpen, 
    Edit2, 
    Calendar, 
    Dices, 
    ShoppingCart, 
    Users,
    Trash2,
    CheckCircle2,
    Timer,
    Loader2,
    Sparkles
} from 'lucide-react';
import { Meal, MealPlan, MealType } from '../types';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from './ConfirmModal';
import { getDayName } from '../utils/dateUtils';
import { useRecipeTimers } from '../hooks/useRecipeTimers';
import { RecipeTimerBar } from './RecipeTimerBar';
import { parseStepTimers, formatRemainingTime } from '../utils/timerUtils';
import { RecipeAiHelpModal } from './RecipeAiHelpModal';

interface MealDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    meal: Meal | null;
    mealPlans?: MealPlan[];
    onEdit?: (meal: Meal) => void;
    onPlanMeal?: (meal: Meal) => void;
    onAddToShoppingList?: (meal: Meal) => void;
    onTagClick?: (tag: string) => void;
    onRandomMeal?: () => void;
    onDelete?: (meal: Meal) => void;
    onPlanSuccess?: () => void;
    onFetchAIRecipe?: (meal: Meal) => void;
    isAiLoading?: boolean;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    meal, 
    mealPlans,
    onEdit, 
    onPlanMeal, 
    onAddToShoppingList,
    onTagClick,
    onRandomMeal,
    onDelete,
    onPlanSuccess,
    onFetchAIRecipe,
    isAiLoading = false
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showCloseQuestion, setShowCloseQuestion] = useState(false);
    const [showPlanMealPrompt, setShowPlanMealPrompt] = useState(false);
    const [showRecipeAiHelp, setShowRecipeAiHelp] = useState(false);

    const {
        timers,
        startOrAddTimer,
        toggleTimer,
        resetTimer,
        adjustTimer,
        removeTimer,
        clearAllTimers
    } = useRecipeTimers();

    useEffect(() => {
        if (!isOpen) {
            clearAllTimers();
        }
    }, [isOpen, clearAllTimers]);

    const handleDelete = () => {
        if (meal && onDelete) {
            setShowDeleteConfirm(true);
        }
    };

    const confirmDelete = () => {
        if (meal && onDelete) {
            onDelete(meal);
        }
        setShowDeleteConfirm(false);
    };

    const getPlannedInfo = useMemo(() => {
        if (!meal || !mealPlans) return [];
        const plannedInfo: { date: string; type: MealType }[] = [];
        const mealNameLower = meal.name.toLowerCase();

        mealPlans.forEach(plan => {
            plan.days.forEach(day => {
                day.meals.forEach(m => {
                    if (m.plannedMeal.customTitle?.toLowerCase() === mealNameLower) {
                        plannedInfo.push({ date: day.date, type: m.type });
                    }
                });
            });
        });
        return plannedInfo;
    }, [meal, mealPlans]);

    const isMealPlanned = useMemo(() => {
        return getPlannedInfo.length > 0;
    }, [getPlannedInfo]);

    // Handle body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleAddToShoppingList = async () => {
        if (!meal || !onAddToShoppingList) return;
        
        await onAddToShoppingList(meal);
        
        if (!isMealPlanned) {
            setShowPlanMealPrompt(true);
        }
    };

    const handlePlanMealFromPrompt = () => {
        if (meal && onPlanMeal) {
            onPlanMeal(meal);
        }
        setShowPlanMealPrompt(false);
    };

    const handleSkipPlanMeal = () => {
        setShowPlanMealPrompt(false);
    };

    useEffect(() => {
        if (onPlanSuccess) {
            setShowCloseQuestion(true);
        } else {
            setShowCloseQuestion(false);
        }
    }, [onPlanSuccess]);

    const formatDay = (dateStr: string) => {
        const date = new Date(dateStr);
        return getDayName(date, t);
    };

    if (!isOpen || !meal) return null;

    const hasIngredients = meal.ingredients && meal.ingredients.length > 0;
    const hasInstructions = meal.instructions && meal.instructions.length > 0;
    const hasRecipeData = hasIngredients && hasInstructions;

    return (
        <div 
            className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="meal-detail-title"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg md:max-w-[calc(100vw-2rem)] 2xl:max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200"
            >
                {/* Hero / Header Image */}
                <div className="relative h-36 sm:h-56 w-full overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0">
                    {meal.imageUrl ? (
                        <img 
                            src={meal.imageUrl} 
                            alt={meal.name} 
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-gray-900 dark:to-gray-800">
                            <Utensils className="w-16 h-16 opacity-40 text-blue-500" />
                        </div>
                    )}
                    <button 
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
                        title={t('common.close', 'Stäng')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                    <div>
                        <h2 id="meal-detail-title" className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                            {meal.name}
                        </h2>
                        
                        {getPlannedInfo.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-1.5">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span>
                                    {t('meals.plannedInfo', 'Planerad: {{dates}}', {
                                        dates: getPlannedInfo
                                            .map(info => `${formatDay(info.date)} (${t(`mealTypes.${info.type}`)})`)
                                            .join(', ')
                                    })}
                                </span>
                            </div>
                        )}
                        
                        {meal.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
                                {meal.description}
                            </p>
                        )}
                    </div>

                    {/* Metadata chips: servings, tags */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {meal.servings && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 font-medium">
                                <Users size={13} className="text-blue-500" />
                                {meal.servings} {t('common.servings', 'portioner')}
                            </span>
                        )}

                        {meal.tags && meal.tags.length > 0 && meal.tags.map(tag => (
                            <button
                                type="button"
                                key={tag} 
                                onClick={() => onTagClick?.(tag)}
                                disabled={!onTagClick}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-xs disabled:cursor-default hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                <Tag size={11} />
                                {tag}
                            </button>
                        ))}
                    </div>

                    {!hasRecipeData && onFetchAIRecipe && (
                        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/60 rounded-xl p-4 text-center">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                {!hasIngredients && !hasInstructions 
                                    ? t('meals.missingIngredientsAndInstructions', 'Receptet saknar både ingredienser och instruktioner.')
                                    : !hasIngredients 
                                        ? t('meals.missingIngredients', 'Receptet saknar ingredienser.')
                                        : t('meals.missingInstructions', 'Receptet saknar instruktioner.')}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                {t('meals.fetchRecipeWithAI', 'Vill du hämta och komplettera receptet med hjälp av AI?')}
                            </p>
                            {meal && (
                                <button
                                    type="button"
                                    onClick={() => onFetchAIRecipe(meal)}
                                    disabled={isAiLoading}
                                    className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800/70 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
                                >
                                    {isAiLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>{t('meals.enrichingWithAI', 'Kompletterar med AI...')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            <span>{t('meals.fetchRecipeWithAIButton', 'Hämta recept med AI')}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Tabs (Ingredients / Instructions) */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl text-xs font-semibold">
                        <button 
                            type="button"
                            onClick={() => setActiveTab('ingredients')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                                activeTab === 'ingredients' 
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            <Utensils size={14} />
                            {t('meals.ingredients', 'Ingredienser')}
                            {hasIngredients && <span>({meal.ingredients!.length})</span>}
                        </button>

                        <button 
                            type="button"
                            onClick={() => setActiveTab('instructions')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                                activeTab === 'instructions' 
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            <BookOpen size={14} />
                            {t('meals.preparation', 'Tillagning')}
                            {hasInstructions && <span>({meal.instructions!.length})</span>}
                        </button>
                    </div>

                    {/* Tab 1: Ingredients List */}
                    {activeTab === 'ingredients' && (
                        <div className="space-y-2 animate-in fade-in duration-150">
                            {hasIngredients ? (
                                <ul className="space-y-1.5">
                                    {meal.ingredients!.map((ing, idx) => (
                                        <li 
                                            key={idx} 
                                            className="text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
                                        >
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {ing.text}
                                            </span>
                                            {ing.amount && (
                                                <span className="font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-700/60">
                                                    {ing.amount}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-400 italic text-center py-6">
                                    {t('meals.noIngredients', 'Inga ingredienser listade.')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Instructions */}
                    {activeTab === 'instructions' && (
                        <div className="space-y-2.5 animate-in fade-in duration-150">
                            {hasInstructions ? (
                                <ol className="space-y-2">
                                    {meal.instructions!.map((step, idx) => {
                                        const detectedTimers = parseStepTimers(step);

                                        return (
                                            <li 
                                                key={idx} 
                                                className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
                                            >
                                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[11px] mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <span className="leading-relaxed block">{step}</span>
                                                    {detectedTimers.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {detectedTimers.map((dt, dtIdx) => {
                                                                const activeTimer = timers.find(
                                                                    t => t.stepIndex === idx && t.label === dt.label
                                                                );
                                                                const isRunning = activeTimer?.isRunning;
                                                                const isFinished = activeTimer?.isFinished;

                                                                return (
                                                                    <button
                                                                        key={dtIdx}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (activeTimer) {
                                                                                toggleTimer(activeTimer.id);
                                                                            } else {
                                                                                startOrAddTimer(idx, idx + 1, dt.totalSeconds, dt.label);
                                                                            }
                                                                        }}
                                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                                                            isFinished
                                                                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 animate-pulse'
                                                                                : isRunning
                                                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                                                                                    : activeTimer
                                                                                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                                                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                                                                        }`}
                                                                        title={activeTimer ? (isRunning ? t('timers.pause', 'Pausa') : t('timers.resume', 'Starta')) : t('timers.start', 'Starta timer')}
                                                                    >
                                                                        <Timer size={12} className={isRunning ? 'animate-spin' : ''} />
                                                                        {isFinished ? (
                                                                            <span>{t('timers.done', 'Klart!')} ({dt.label})</span>
                                                                        ) : activeTimer ? (
                                                                            <span>{formatRemainingTime(activeTimer.remainingSeconds)} ({dt.label})</span>
                                                                        ) : (
                                                                            <span>{t('timers.startTimerFor', `Starta timer (${dt.label})`, { time: dt.label })}</span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            ) : (
                                <p className="text-xs text-gray-400 italic text-center py-6">
                                    {t('meals.noInstructions', 'Inga tillagningssteg listade.')}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Floating/Fixed Timer Bar if any timers are active */}
                <RecipeTimerBar
                    timers={timers}
                    onToggle={toggleTimer}
                    onReset={resetTimer}
                    onAdjust={adjustTimer}
                    onRemove={removeTimer}
                />

                {/* Action Footer */}
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-700/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    {/* Secondary actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {onRandomMeal && (
                            <button
                                type="button"
                                onClick={onRandomMeal}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Dices size={14} className="text-blue-500" />
                                <span>{t('mealDetail.randomMeal', 'Slumpa ny')}</span>
                            </button>
                        )}
                        {onEdit && (
                            <button 
                                type="button"
                                onClick={() => onEdit(meal)}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Edit2 size={13} />
                                <span>{t('common.edit', 'Redigera')}</span>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-200/60 dark:border-red-800/40 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            >
                                <Trash2 size={13} />
                                <span>{t('common.delete', 'Ta bort')}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowRecipeAiHelp(true)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                        >
                            <Sparkles size={13} />
                            <span>{t('recipeAiHelp.openButton', 'Fråga AI')}</span>
                        </button>
                    </div>

                    {/* Primary actions */}
                    <div className="flex items-center gap-2">
                        {onAddToShoppingList && hasIngredients && (
                            <button
                                type="button"
                                onClick={handleAddToShoppingList}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                            >
                                <ShoppingCart size={13} />
                                <span>{t('meals.addToShoppingList', 'Handla')}</span>
                            </button>
                        )}

                        {onPlanMeal && (
                            <button
                                type="button"
                                onClick={() => onPlanMeal(meal)}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                            >
                                <Calendar size={13} />
                                <span>{t('meals.planInMealPlan', 'Planera')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title={t('meals.deleteMeal', 'Ta bort måltid')}
                message={t('meals.deleteMealConfirm', 'Är du säker på att du vill ta bort detta recept? Denna åtgärd kan inte ångras.')}
                confirmText={t('common.delete', 'Ta bort')}
                cancelText={t('common.cancel', 'Avbryt')}
                isDestructive={true}
            />

            <RecipeAiHelpModal
                isOpen={showRecipeAiHelp}
                onClose={() => setShowRecipeAiHelp(false)}
                meal={meal}
            />

            {showPlanMealPrompt && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm w-full">
                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-1 text-center">
                            {t('meals.addToShoppingListPrompt', 'Vill du också planera in denna måltid?')}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 text-center">
                            {t('meals.addToShoppingListPromptDescription', 'Måltiden är inte inplanerad ännu. Vill du lägga till den i ditt matschema?')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handlePlanMealFromPrompt}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t('common.save', 'Ja')}
                            </button>
                            <button
                                onClick={handleSkipPlanMeal}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                {t('common.cancel', 'Nej')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCloseQuestion && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm w-full">
                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-1 text-center">
                            {t('meals.closeModalAfterPlanning', 'Vill du stänga receptmodalen?')}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 text-center">
                            {t('meals.closeModalAfterPlanningDescription', 'Måltiden är nu planerad i ditt matschema.')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t('common.close', 'Stäng')}
                            </button>
                            <button
                                onClick={() => setShowCloseQuestion(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                {t('common.cancel', 'Nej')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};