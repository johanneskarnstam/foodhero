import React, { useState } from 'react';
import { Calendar, Utensils } from 'lucide-react';
import { Meal, MealType } from '../types';
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
    onAfterSave?: () => void;
}

const getNext7Days = (): Date[] => {
    const days: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
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
    onAfterSave
}) => {
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedType, setSelectedType] = useState<MealType>('dinner');

    const next7Days = getNext7Days();

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
                                {t('mealplan.selectDay', 'Välj dag')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {next7Days.map(day => {
                                    const isSelected = selectedDate?.toDateString() === day.toDateString();
                                    const isToday = day.toDateString() === new Date().toDateString();
                                    
                                    return (
                                        <button
                                            key={day.toDateString()}
                                            onClick={() => setSelectedDate(day)}
                                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                                isSelected
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                                            }`}
                                        >
                                            <div className="text-xs opacity-70">
                                                {formatDatePart(day, 'EEE')}
                                            </div>
                                            <div className={`font-medium ${isToday ? 'underline' : ''}`}>
                                                {formatDatePart(day, 'd')}
                                            </div>
                                            <div className="text-xs opacity-70">
                                                {formatDatePart(day, 'MMM')}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('mealplan.selectMealType', 'Välj måltidstyp')}
                            </label>
                            <div className="flex gap-2">
                                {(['lunch', 'dinner'] as MealType[]).map(type => {
                                    const isSelected = selectedType === type;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedType(type)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                                isSelected
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                                            }`}
                                        >
                                            <Utensils className="w-4 h-4" />
                                            {t(`mealTypes.${type}`, type)}
                                        </button>
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