import React from 'react';
import { MealDetailModal } from './MealDetailModal';
import { Meal } from '../types';

interface RecipeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    meal: Meal | null;
    onEdit?: (meal: Meal) => void;
    onPlanMeal?: (meal: Meal) => void;
    onAddToShoppingList?: (meal: Meal) => void;
    onTagClick?: (tag: string) => void;
    onDelete?: (meal: Meal) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = (props) => {
    return <MealDetailModal {...props} />;
};