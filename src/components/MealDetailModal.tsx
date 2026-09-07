import React, { useState } from 'react';
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
    Trash2
} from 'lucide-react';
import { Meal } from '../types';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from './ConfirmModal';

interface MealDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    meal: Meal | null;
    onEdit?: (meal: Meal) => void;
    onPlanMeal?: (meal: Meal) => void;
    onAddToShoppingList?: (meal: Meal) => void;
    onRandomMeal?: () => void;
    onDelete?: (meal: Meal) => void;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    meal, 
    onEdit, 
    onPlanMeal, 
    onAddToShoppingList,
    onRandomMeal,
    onDelete
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

    if (!isOpen || !meal) return null;

    const hasIngredients = meal.ingredients && meal.ingredients.length > 0;
    const hasInstructions = meal.instructions && meal.instructions.length > 0;

    return (
        <div 
            className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="meal-detail-title"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200"
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
                            <span 
                                key={tag} 
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-xs"
                            >
                                <Tag size={11} />
                                {tag}
                            </span>
                        ))}
                    </div>

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
                                    {meal.instructions!.map((step, idx) => (
                                        <li 
                                            key={idx} 
                                            className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
                                        >
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[11px] mt-0.5">
                                                {idx + 1}
                                            </span>
                                            <span className="leading-relaxed">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-xs text-gray-400 italic text-center py-6">
                                    {t('meals.noInstructions', 'Inga tillagningssteg listade.')}
                                </p>
                            )}
                        </div>
                    )}
                </div>

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
                    </div>

                    {/* Primary actions */}
                    <div className="flex items-center gap-2">
                        {onAddToShoppingList && hasIngredients && (
                            <button
                                type="button"
                                onClick={() => onAddToShoppingList(meal)}
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
        </div>
    );
};