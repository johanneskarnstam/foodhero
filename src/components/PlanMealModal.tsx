import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Meal, MealType, MealPlan } from '../types';
import { useTranslation } from 'react-i18next';

const formatDatePart = (date: Date, format: string, t: (key: string) => string): string => {
    const dayIndex = date.getDay();
    const monthIndex = date.getMonth();
    
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    switch (format) {
        case 'EEE': return t(`daysShort.${dayKeys[dayIndex]}`);
        case 'd': return String(date.getDate());
        case 'MMM': return t(`monthsShort.${monthKeys[monthIndex]}`);
        default: return '';
    }
};

interface PlanMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selections: { date: Date; type: MealType }[]) => void;
    meal: Meal | null;
    mealPlans?: MealPlan[];
    onAfterSave?: () => void;
    allowMultiple?: boolean;
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
    onAfterSave,
    allowMultiple = false
}) => {
    const { t } = useTranslation();
    const [selectedSlots, setSelectedSlots] = useState<{ date: Date; type: MealType }[]>([]);

    // Handle body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

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

    const isSlotSelected = (date: Date, type: MealType): boolean => {
        return selectedSlots.some(slot => 
            slot.date.toISOString().split('T')[0] === date.toISOString().split('T')[0] && 
            slot.type === type
        );
    };

    const toggleSlotSelection = (date: Date, type: MealType) => {
        const dateStr = date.toISOString().split('T')[0];
        const existingIndex = selectedSlots.findIndex(slot => 
            slot.date.toISOString().split('T')[0] === dateStr && 
            slot.type === type
        );
        
        if (existingIndex >= 0) {
            // Remove the slot
            setSelectedSlots(selectedSlots.filter((_, index) => index !== existingIndex));
        } else {
            // Add the slot
            if (allowMultiple) {
                setSelectedSlots([...selectedSlots, { date, type }]);
            } else {
                // Single selection mode - replace any existing selection
                setSelectedSlots([{ date, type }]);
            }
        }
    };

    const handleSave = () => {
        if (selectedSlots.length === 0) return;
        onSave(selectedSlots);
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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md md:max-w-[calc(100vw-2rem)] lg:max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
            >
                <div className="p-6 overflow-y-auto">
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
                        {allowMultiple && selectedSlots.length > 0 && (
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                                    {t('mealplan.selectedSlots', 'Valda tillfällen')}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSlots.map((slot, index) => (
                                        <span
                                            key={`${slot.date.toISOString()}-${slot.type}-${index}`}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                        >
                                            {formatDatePart(slot.date, 'EEE', t)} {formatDatePart(slot.date, 'd', t)} - {t(`mealTypes.${slot.type}`)}
                                            <button
                                                onClick={() => toggleSlotSelection(slot.date, slot.type)}
                                                className="text-blue-500 hover:text-blue-700 ml-1"
                                                aria-label={t('common.remove', 'Ta bort')}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('mealplan.selectDayAndMeal', 'Välj dag och måltid')}
                            </label>
                            <div className="space-y-2">
                                {next10Days.map((day) => {
                                    const dateStr = day.toISOString().split('T')[0];
                                    const formattedDate = `${formatDatePart(day, 'EEE', t)} ${formatDatePart(day, 'd', t)}`;

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
                                                const isSelected = isSlotSelected(day, type);
                                                const isDisabled = !!plannedMeal;

                                                return (
                                                    <button
                                                        key={`${dateStr}-${type}`}
                                                        onClick={() => toggleSlotSelection(day, type)}
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
                            disabled={selectedSlots.length === 0}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Calendar className="w-4 h-4" />
                            {allowMultiple && selectedSlots.length > 1
                                ? t('mealplan.planMultipleMeals', { count: selectedSlots.length })
                                : t('common.save', 'Spara')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};