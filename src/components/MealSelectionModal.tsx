import React, { useMemo } from 'react';
import { Modal } from './Modal';
import { Meal, MealPlan } from '../types';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MealSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    meals: Meal[];
    mealPlans: MealPlan[];
    onSelect: (mealName: string) => void;
}

export const MealSelectionModal: React.FC<MealSelectionModalProps> = ({ 
    isOpen, 
    onClose, 
    meals, 
    mealPlans, 
    onSelect 
}) => {
    const { t } = useTranslation();
    const plannedInNext10Days = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tenDaysLater = new Date(today);
        tenDaysLater.setDate(today.getDate() + 9);
        tenDaysLater.setHours(23, 59, 59, 999);

        const plannedMeals = new Set<string>();
        
        mealPlans.forEach(plan => {
            plan.days.forEach(day => {
                const dayDate = new Date(day.date);
                if (dayDate >= today && dayDate <= tenDaysLater) {
                    day.meals.forEach(m => {
                        if (m.plannedMeal.customTitle) {
                            plannedMeals.add(m.plannedMeal.customTitle.toLowerCase());
                        }
                    });
                }
            });
        });
        
        return plannedMeals;
    }, [mealPlans]);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            onConfirm={() => {}} 
            title={t('mealSelection.title')}
            message={t('mealSelection.subtitle')}
            confirmText={t('common.close')}
        >
            <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {meals.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">{t('mealSelection.noMealsFound')}</p>
                ) : (
                    meals.map(meal => {
                        const isPlanned = plannedInNext10Days.has(meal.name.toLowerCase());
                        return (
                            <button
                                key={meal.id}
                                onClick={() => {
                                    onSelect(meal.name);
                                    onClose();
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left group"
                            >
                                <span className={`font-medium ${isPlanned ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {meal.name}
                                </span>
                                {isPlanned && (
                                    <div className="flex items-center gap-1 text-xs text-blue-500 font-medium">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {t('mealSelection.plannedSoon')}
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </Modal>
    );
};