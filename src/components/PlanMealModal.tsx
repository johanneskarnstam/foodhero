import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Meal, MealType, MealPlan } from '../types';
import { useTranslation } from 'react-i18next';

const formatDatePart = (date: Date, format: string): string => {
    const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    switch (format) {
        case 'EEE': return dayNamesShort[date.getDay()];
        case 'd': return String(date.getDate());
        case 'MMM': return monthNamesShort[date.getMonth()];
        default: return '';
    }
};

interface PlanMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (date: Date, type: MealType) => void;
    meal: Meal | null;
    mealPlans?: MealPlan[];
    onAfterSave?: () => void;
}

const getNext10Days = (): Date[] => {
    const days: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 10; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() + i);
        days.push(day);
    }
    
    return days;
};

export const PlanMealModal: React.FC<PlanMealModalProps> = ({
    isOpen,
    onClose,
    onSave,
    meal,
    mealPlans,
    onAfterSave
}) => {
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedType, setSelectedType] = useState<MealType>('dinner');

    const next10Days = getNext10Days();

    const getPlannedMealForSlot = (date: Date, type: MealType): string | null => {
        if (!mealPlans) return null;

        const dateStr = date.toISOString().split('T')[0];
        for (const plan of mealPlans) {
            for (const day of plan.days) {
                if (day.date === dateStr) {
                    for (const meal of day.meals) {
                        if (meal.type === type) {
                            return meal.plannedMeal.customTitle || null;
                        }
                    }
                }
            }
        }
        return null;
    };

    const handleSave = () => {
        if (!selectedDate) return;
        onSave(selectedDate, selectedType);
        onAfterSave?.();
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
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-meal-title"
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
            >
                <div className="p-6">
                    <h2
                        id="plan-meal-title"
                        className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
                    >
                        {t('mealplan.planMealTitle', 'Planera in måltid')}
                    </h2>
                    {meal && (
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {t('mealplan.planMealDescription', 'Välj dag och måltidstyp för {{mealName}}', { mealName: meal.name })}
                        </p>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('mealplan.selectDayAndMeal', 'Välj dag och måltid')}
                            </label>
                            <div className="space-y-2">
                                {next10Days.map((day) => {
                                    const dateStr = day.toISOString().split('T')[0];
                                    const formattedDate = `${formatDatePart(day, 'EEE')} ${formatDatePart(day, 'd')}`;

                                    return (
                                        <div
                                            key={dateStr}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                                        >
                                            <div className="w-16 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {formattedDate}
                                            </div>
                                            
                                            {(['lunch', 'dinner'] as MealType[]).map(type => {
                                                const plannedMeal = getPlannedMealForSlot(day, type);
                                                const isSelected = selectedDate?.toISOString().split('T')[0] === dateStr && selectedType === type;
                                                const isDisabled = !!plannedMeal;

                                                return (
                                                    <button
                                                        key={`${dateStr}-${type}`}
                                                        onClick={() => {
                                                            setSelectedDate(day);
                                                            setSelectedType(type);
                                                        }}
                                                        disabled={isDisabled}
                                                        className={`flex-1 p-2 rounded-lg text-sm font-medium transition-all ${
                                                            isSelected
                                                                ? 'bg-blue-500 text-white'
                                                                : isDisabled
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 cursor-default'
                                                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                                                        }`}
                                                    >
                                                        {plannedMeal || t(`mealTypes.${type}`)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {t('common.cancel', 'Avbryt')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedDate}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Calendar className="w-4 h-4" />
                            {t('common.save', 'Spara')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};