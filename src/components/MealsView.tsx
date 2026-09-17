import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Utensils, 
    Plus, 
    Trash2, 
    Edit2, 
    ShoppingCart, 
    Dices, 
    Search, 
    Tag, 
    ChefHat,
    X,
    Users,
    Sparkles
} from 'lucide-react';
import { MealEditModal } from './MealEditModal';
import { MealDetailModal } from './MealDetailModal';
import { PlanMealModal } from './PlanMealModal';
import { IngredientSelectionModal } from './IngredientSelectionModal';
import { ConfirmModal } from './ConfirmModal';
import { AiRecipeModal } from './AiRecipeModal';
import { v4 as uuidv4 } from 'uuid';
import { Item, Meal, MealType } from '../types';
import { useMealPlan } from '../hooks/useMealPlan';

export const MealsView: React.FC = () => {
    const { meals, addMeal, updateMeal, deleteMeal, addItemsToList, defaultListId } = useApp();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const { mealPlans, handleMealChange } = useMealPlan();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(() => searchParams.get('tag'));
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
    
    const [viewingMeal, setViewingMeal] = useState<Meal | null>(null);
    const [isPlanningOpen, setIsPlanningOpen] = useState(false);
    const [planningMeal, setPlanningMeal] = useState<Meal | null>(null);
    const [showCloseQuestion, setShowCloseQuestion] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    
    // State for shopping cart icon flow
    const [showPlanMealPrompt, setShowPlanMealPrompt] = useState(false);
    const [mealToPlanAfterShopping, setMealToPlanAfterShopping] = useState<Meal | null>(null);
    
    // Delete confirmation modal state
    const [deleteConfirmMeal, setDeleteConfirmMeal] = useState<Meal | null>(null);

    const [ingredientModalConfig, setIngredientModalConfig] = useState<{
        isOpen: boolean;
        mealName: string;
        ingredients: { text: string; amount?: string; checkIfExistAtHome?: boolean }[];
    }>({
        isOpen: false,
        mealName: '',
        ingredients: []
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

    useEffect(() => {
        setSelectedTag(searchParams.get('tag'));
    }, [searchParams.toString()]);

    const allMeals = useMemo(() => {
        const savedNames = new Set(meals.map(meal => meal.name.trim().toLowerCase()));
        return [
            ...meals,
            ...mealSuggestions.filter(meal => !savedNames.has(meal.name.trim().toLowerCase()))
        ];
    }, [meals, mealSuggestions]);

    // Extract all unique tags across saved meals
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        allMeals.forEach(m => {
            m.tags?.forEach(tag => {
                if (tag.trim()) tagSet.add(tag.trim());
            });
        });
        return Array.from(tagSet);
    }, [allMeals]);

    // Filter meals based on search query and selected tag
    const filteredMeals = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const mealsToFilter = selectedTag ? allMeals : meals;
        return mealsToFilter.filter(meal => {
            const matchesQuery = !query 
                || meal.name.toLowerCase().includes(query)
                || (meal.description && meal.description.toLowerCase().includes(query))
                || (meal.ingredients && meal.ingredients.some(i => i.text.toLowerCase().includes(query)));
            
            const matchesTag = !selectedTag 
                || (meal.tags && meal.tags.some(tg => tg.toLowerCase() === selectedTag.toLowerCase()));

            return matchesQuery && matchesTag;
        });
    }, [allMeals, meals, searchQuery, selectedTag]);

    const handleTagSelect = (tag: string | null) => {
        setSelectedTag(tag);
        const nextParams = new URLSearchParams(searchParams);
        if (tag) {
            nextParams.set('tag', tag);
        } else {
            nextParams.delete('tag');
        }
        setSearchParams(nextParams);
    };

    const handleMealTagClick = (tag: string) => {
        setViewingMeal(null);
        navigate(`/meals?tag=${encodeURIComponent(tag)}`);
    };

    const handleCreateNewRecipe = () => {
        setEditingMeal(null);
        setIsEditModalOpen(true);
    };

    const handleStartEdit = (meal: Meal) => {
        setEditingMeal(meal);
        setIsEditModalOpen(true);
    };

    const handleSaveMeal = async (mealData: Partial<Meal> & { name: string }, mealId?: string) => {
        try {
            if (mealId) {
                await updateMeal(mealId, mealData);
                showToast(t('toasts.itemUpdated', 'Måltid uppdaterad'), 'success');
            } else {
                await addMeal(mealData.name, mealData);
                showToast(t('toasts.itemAdded', 'Recept skapat'), 'success');
            }
            setIsEditModalOpen(false);
            setEditingMeal(null);
        } catch {
            showToast(t('toasts.error', 'Ett fel uppstod'), 'error');
        }
    };

    const handleSaveAiRecipe = async (recipeData: Omit<Meal, 'id' | 'createdAt'>) => {
        try {
            await addMeal(recipeData.name, recipeData);
            showToast(t('toasts.itemAdded', 'Recept skapat'), 'success');
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
            if (viewingMeal?.id === deleteConfirmMeal.id) setViewingMeal(null);
            showToast(t('toasts.itemDeleted', 'Måltid borttagen'), 'info');
        } catch {
            showToast(t('toasts.error', 'Ett fel uppstod'), 'error');
        } finally {
            setDeleteConfirmMeal(null);
        }
    };

    const handleRandomMeal = () => {
        const pool = meals.length > 0 ? meals : mealSuggestions;
        if (pool.length === 0) return;
        const randomMeal = pool[Math.floor(Math.random() * pool.length)];
        setViewingMeal(randomMeal);
    };

    const handlePlanMeal = (meal: Meal) => {
        setPlanningMeal(meal);
        setIsPlanningOpen(true);
    };

    const handleSavePlannedMeal = (selections: { date: Date; type: MealType }[]) => {
        if (planningMeal) {
            selections.forEach(selection => {
                handleMealChange(selection.date, selection.type, planningMeal.name);
            });
            const count = selections.length;
            showToast(
                count === 1 
                    ? t('toasts.mealPlanned') 
                    : t('toasts.mealsPlanned', { count }),
                'success'
            );
        }
    };

    const handlePlanSuccess = () => {
        setShowCloseQuestion(true);
    };



    const handleOpenIngredientTransfer = (meal: Meal) => {
        if (!meal.ingredients || meal.ingredients.length === 0) {
            showToast(t('meals.noIngredients', 'Inga ingredienser listade för receptet'), 'info');
            return;
        }

        setMealToPlanAfterShopping(meal);
        setIngredientModalConfig({
            isOpen: true,
            mealName: meal.name,
            ingredients: meal.ingredients
        });
    };

    const handleConfirmTransfer = async (selectedItems: { text: string; amount?: string }[]) => {
        if (!defaultListId) {
            showToast(t('errors.noList', 'Kunde inte hitta inköpslistan'), 'error');
            return;
        }

        const itemsToAdd: Item[] = selectedItems.map(item => ({
            id: uuidv4(),
            text: `${item.amount ? item.amount + ' ' : ''}${item.text}`.trim(),
            completed: false
        }));

        if (itemsToAdd.length === 0) return;

        try {
            await addItemsToList(defaultListId, itemsToAdd);
            showToast(`${itemsToAdd.length} ${t('common.items', 'artiklar')} tillagda i inköpslistan`, 'success');
            
            // Check if the meal is already planned
            if (mealToPlanAfterShopping) {
                const isAlreadyPlanned = mealPlans.some(plan =>
                    plan.days.some(day =>
                        day.meals.some(m => m.plannedMeal.customTitle?.toLowerCase() === mealToPlanAfterShopping.name.toLowerCase())
                    )
                );
                
                if (!isAlreadyPlanned) {
                    setShowPlanMealPrompt(true);
                } else {
                    // Close the ingredient modal and reset state
                    setIngredientModalConfig({ isOpen: false, mealName: '', ingredients: [] });
                    setMealToPlanAfterShopping(null);
                }
            } else {
                // Close the ingredient modal if no meal to plan
                setIngredientModalConfig({ isOpen: false, mealName: '', ingredients: [] });
            }
        } catch {
            showToast(t('toasts.error', 'Ett fel uppstod'), 'error');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <ChefHat className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        {t('views.meals', 'Recept & Måltider')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {t('views.mealsDescription', 'Dina sparade favoritrecept och måltidsidéer')} ({meals.length})
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleRandomMeal}
                        className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all border border-blue-200/60 dark:border-blue-800/40 cursor-pointer"
                        title={t('views.randomMeal', 'Slumpa måltid')}
                    >
                        <Dices className="w-4 h-4" />
                        <span>{t('views.randomMeal', 'Slumpa')}</span>
                    </button>

                    <button
                        id="meals-create-with-ai-btn"
                        onClick={() => setIsAiModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>{t('ai.generateRecipe')}</span>
                    </button>

                    <button
                        onClick={handleCreateNewRecipe}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('meals.createRecipe', 'Skapa recept')}</span>
                    </button>
                    
                    <button
                        onClick={() => navigate('/ingredients')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all border border-emerald-200/60 dark:border-emerald-800/40 cursor-pointer"
                        title={t('meals.searchByIngredient', 'Sök på ingrediens')}
                    >
                        <Search className="w-4 h-4" />
                        <span>{t('meals.searchByIngredient', 'Sök ingrediens')}</span>
                    </button>
                </div>
            </div>

            {/* Search & Tag Filter Bar */}
            <div className="space-y-3 bg-white dark:bg-gray-900/70 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('meals.searchPlaceholder', 'Sök bland recept & taggar...')}
                        className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {allTags.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
                        <button
                            type="button"
                            onClick={() => handleTagSelect(null)}
                            className={`px-2.5 py-1 rounded-full font-medium transition-all flex-shrink-0 ${
                                selectedTag === null
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            Alla taggar
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => handleTagSelect(selectedTag === tag ? null : tag)}
                                className={`px-2.5 py-1 rounded-full font-medium transition-all flex-shrink-0 flex items-center gap-1 ${
                                    selectedTag === tag
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Tag className="w-2.5 h-2.5" />
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Recipes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMeals.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-white dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                        <Utensils className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                            {meals.length === 0 
                                ? t('views.noMeals', 'Inga sparade måltider än') 
                                : t('mealplan.noMealsMatch', 'Inga recept matchar din sökning')}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                            {meals.length === 0 
                                ? 'Klicka på "Skapa recept" ovan för att lägga till ditt första favoritrecept med ingredienser.' 
                                : 'Testa att rensa sökningen eller välj en annan tagg.'}
                        </p>
                    </div>
                ) : (
                    filteredMeals.map((meal) => {
                        const isSuggestion = meal.id?.startsWith('sug-') ?? false;
                        return (
                        <div 
                            key={meal.id} 
                            onClick={() => setViewingMeal(meal)}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 cursor-pointer"
                        >
                            {/* Image Thumbnail */}
                            <div className="relative h-44 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                                {meal.imageUrl ? (
                                    <img 
                                        src={meal.imageUrl} 
                                        alt={meal.name}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600 bg-gradient-to-br from-blue-50/40 to-indigo-50/20 dark:from-gray-900 dark:to-gray-800">
                                        <Utensils className="w-12 h-12 opacity-30 text-blue-500" />
                                    </div>
                                )}
                                
                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!isSuggestion && <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEdit(meal);
                                        }}
                                        className="p-2 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:text-blue-600 rounded-full shadow-sm transition-colors backdrop-blur-xs"
                                        title={t('common.edit', 'Redigera')}
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>}
                                    {!isSuggestion && <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteMeal(meal);
                                        }}
                                        className="p-2 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:text-red-600 rounded-full shadow-sm transition-colors backdrop-blur-xs"
                                        title={t('common.delete', 'Ta bort')}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>}
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {meal.name}
                                </h3>

                                {meal.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                                        {meal.description}
                                    </p>
                                )}
                                
                                <div className="mt-auto pt-2 space-y-3 border-t border-gray-100 dark:border-gray-800/80">
                                    {/* Meta pills */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {meal.servings && (
                                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">
                                                <Users size={10} />
                                                {meal.servings} port
                                            </span>
                                        )}
                                        {meal.ingredients && meal.ingredients.length > 0 && (
                                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">
                                                <Utensils size={10} />
                                                {meal.ingredients.length} ingredienser
                                            </span>
                                        )}
                                        {meal.tags?.slice(0, 2).map(tag => (
                                            <span key={tag} className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Card Action Buttons */}
                                    <div className="flex items-center justify-between gap-2 pt-1">
                                        {!isSuggestion && <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlanMeal(meal);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                                        >
                                            {t('meals.planInMealPlan', 'Planera')}
                                        </button>}
                                        
                                        {meal.ingredients && meal.ingredients.length > 0 && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenIngredientTransfer(meal);
                                                }}
                                                className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors border border-emerald-200/60 dark:border-emerald-800/40"
                                                title={t('meals.addToShoppingList', 'Lägg i inköpslista')}
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                            </button>
                                        )}
                                        
                                        {!isSuggestion && <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteMeal(meal);
                                            }}
                                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors border border-red-200/60 dark:border-red-800/40"
                                            title={t('common.delete', 'Ta bort')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })
                )}
            </div>

            {/* Modals */}
            <MealEditModal 
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingMeal(null);
                }}
                onSave={handleSaveMeal}
                meal={editingMeal}
            />

            <MealDetailModal 
                isOpen={!!viewingMeal}
                onClose={() => {
                    setViewingMeal(null);
                    setShowCloseQuestion(false);
                }}
                onEdit={(meal) => {
                    setViewingMeal(null);
                    handleStartEdit(meal);
                }}
                onPlanMeal={handlePlanMeal}
                onAddToShoppingList={handleOpenIngredientTransfer}
                onRandomMeal={handleRandomMeal}
                onDelete={handleDeleteMeal}
                meal={viewingMeal}
                mealPlans={mealPlans}
                onTagClick={handleMealTagClick}
                onPlanSuccess={showCloseQuestion ? () => setShowCloseQuestion(false) : undefined}
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

            <PlanMealModal
                isOpen={isPlanningOpen}
                onClose={() => {
                    setIsPlanningOpen(false);
                    setPlanningMeal(null);
                    setMealToPlanAfterShopping(null);
                }}
                onSave={handleSavePlannedMeal}
                onAfterSave={() => {
                    handlePlanSuccess();
                    setIngredientModalConfig({ isOpen: false, mealName: '', ingredients: [] });
                    setMealToPlanAfterShopping(null);
                }}
                meal={planningMeal}
                mealPlans={mealPlans}
                allowMultiple={true}
            />

            <IngredientSelectionModal
                isOpen={ingredientModalConfig.isOpen}
                onClose={() => {
                    setIngredientModalConfig({ isOpen: false, mealName: '', ingredients: [] });
                    setMealToPlanAfterShopping(null);
                }}
                title={`Handla till ${ingredientModalConfig.mealName}`}
                plannedMeals={[{
                    name: ingredientModalConfig.mealName,
                    ingredients: ingredientModalConfig.ingredients
                }]}
                onConfirm={handleConfirmTransfer}
            />

            {/* Plan Meal Prompt Modal (shown after adding ingredients from shopping cart icon) */}
            {showPlanMealPrompt && mealToPlanAfterShopping && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm w-full">
                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-1 text-center">
                            {t('meals.addToShoppingListPrompt', 'Vill du också planera in denna måltid?')}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 text-center">
                            {t('meals.addToShoppingListPromptDescription', 'Ingredienserna har lagts till i inköpslistan. Måltiden är inte inplanerad ännu. Vill du lägga till den i ditt matschema?')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowPlanMealPrompt(false);
                                    setIsPlanningOpen(true);
                                    setPlanningMeal(mealToPlanAfterShopping);
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t('common.yes', 'Ja')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowPlanMealPrompt(false);
                                    setMealToPlanAfterShopping(null);
                                    setIngredientModalConfig({ isOpen: false, mealName: '', ingredients: [] });
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                {t('common.no', 'Nej')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AiRecipeModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onSave={handleSaveAiRecipe}
            />
        </div>
    );
};