import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MealDetailModal } from './MealDetailModal';
import { Meal, MealPlan } from '../types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultText?: string) => {
            const translations: Record<string, string> = {
                'meals.addToShoppingList': 'Handla',
                'meals.planInMealPlan': 'Planera',
                'common.edit': 'Redigera',
                'common.delete': 'Ta bort',
                'common.close': 'Stäng',
                'common.cancel': 'Nej',
                'common.save': 'Ja',
                'common.yes': 'Ja',
                'common.no': 'Nej',
                'meals.addToShoppingListPrompt': 'Vill du också planera in denna måltid?',
                'meals.addToShoppingListPromptDescription': 'Ingredienserna har lagts till i inköpslistan. Måltiden är inte inplanerad ännu. Vill du lägga till den i ditt matschema?',
                'meals.closeModalAfterPlanning': 'Vill du stänga receptmodalen?',
                'meals.closeModalAfterPlanningDescription': 'Måltiden är nu planerad i ditt matschema.',
                'meals.deleteMeal': 'Ta bort måltid',
                'meals.deleteMealConfirm': 'Är du säker på att du vill ta bort detta recept? Denna åtgärd kan inte ångras.',
                'tabs.ingredients': 'Ingredienser',
                'tabs.instructions': 'Tillagning',
                'meals.servings': 'portioner',
                'common.random': 'Slumpa ny'
            };
            return translations[key] || defaultText || key;
        }
    })
}));

const mockMeal: Meal = {
    id: 'm-123',
    name: 'Ugnsbakad Lax',
    description: 'Enkel och god lax i ugn med citron',
    imageUrl: 'https://example.com/lax.jpg',
    servings: 4,
    tags: ['Fisk', 'Snabbt'],
    ingredients: [
        { text: 'Laxfilé', amount: '600g' },
        { text: 'Citron', amount: '1 st' }
    ],
    instructions: [
        'Sätt ugnen på 200 grader',
        'Lägg laxen i en ugnsform och pressa över citron',
        'Baka i ugnen i 20 minuter'
    ],
    createdAt: ''
};

describe('MealDetailModal', () => {
    const mockOnClose = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnPlanMeal = vi.fn();
    const mockOnAddToShoppingList = vi.fn();
    const mockOnRandomMeal = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders meal title, description, servings and ingredients', () => {
        render(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={mockMeal}
                onEdit={mockOnEdit}
                onPlanMeal={mockOnPlanMeal}
                onAddToShoppingList={mockOnAddToShoppingList}
                onRandomMeal={mockOnRandomMeal}
            />
        );

        expect(screen.getByText('Ugnsbakad Lax')).toBeInTheDocument();
        expect(screen.getByText('Enkel och god lax i ugn med citron')).toBeInTheDocument();
        expect(screen.getByText('Laxfilé')).toBeInTheDocument();
        expect(screen.getByText('600g')).toBeInTheDocument();
        expect(screen.getByText(/4 portioner/i)).toBeInTheDocument();
    });

    it('toggles between ingredients and instructions tabs', () => {
        render(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={mockMeal}
            />
        );

        // Switch to instructions
        const instructionsTab = screen.getByRole('button', { name: /Tillagning/i });
        fireEvent.click(instructionsTab);

        expect(screen.getByText('Sätt ugnen på 200 grader')).toBeInTheDocument();
        expect(screen.getByText('Baka i ugnen i 20 minuter')).toBeInTheDocument();
    });

    it('triggers action callbacks when action buttons are clicked', async () => {
        render(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={mockMeal}
                onEdit={mockOnEdit}
                onPlanMeal={mockOnPlanMeal}
                onAddToShoppingList={mockOnAddToShoppingList}
                onRandomMeal={mockOnRandomMeal}
            />
        );

        // Click Edit
        const editBtn = screen.getByRole('button', { name: /Redigera/i });
        fireEvent.click(editBtn);
        expect(mockOnEdit).toHaveBeenCalledWith(mockMeal);

        // Click Plan
        const planBtn = screen.getByRole('button', { name: /Planera/i });
        fireEvent.click(planBtn);
        expect(mockOnPlanMeal).toHaveBeenCalledWith(mockMeal);

        // Click Handla (Shopping list) - will add to shopping list first, then show prompt
        const shopBtn = screen.getByRole('button', { name: /Handla/i });
        fireEvent.click(shopBtn);
        
        // Should have called onAddToShoppingList immediately
        expect(mockOnAddToShoppingList).toHaveBeenCalledWith(mockMeal);
        
        // Then shows the prompt since meal is not planned (async due to state update)
        expect(await screen.findByText('Vill du också planera in denna måltid?')).toBeInTheDocument();
        
        // Click "Nej" to close the prompt
        const noBtn = await screen.findByText('Nej');
        fireEvent.click(noBtn);

        // Click Random
        const randomBtn = screen.getByRole('button', { name: /Slumpa ny/i });
        fireEvent.click(randomBtn);
        expect(mockOnRandomMeal).toHaveBeenCalledTimes(1);
    });

    it('shows plan meal prompt after adding to shopping list when meal is not planned', async () => {
        render(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={mockMeal}
                onEdit={mockOnEdit}
                onPlanMeal={mockOnPlanMeal}
                onAddToShoppingList={mockOnAddToShoppingList}
                onRandomMeal={mockOnRandomMeal}
                mealPlans={[]}
            />
        );

        // Click Handla (Shopping list) - should add to shopping list first
        const shopBtn = screen.getByRole('button', { name: /Handla/i });
        fireEvent.click(shopBtn);
        
        // Should have added to shopping list
        expect(mockOnAddToShoppingList).toHaveBeenCalledWith(mockMeal);
        
        // Then should show the prompt (async due to state update)
        expect(await screen.findByText('Vill du också planera in denna måltid?')).toBeInTheDocument();
        expect(screen.getByText(/Ingredienserna har lagts till i inköpslistan/)).toBeInTheDocument();
        
        // Click "Nej" - should only close the prompt
        const noBtn = await screen.findByText('Nej');
        fireEvent.click(noBtn);
        expect(mockOnPlanMeal).not.toHaveBeenCalled();
    });

    it('plans meal when clicking "Ja" on the prompt', async () => {
        render(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={mockMeal}
                onEdit={mockOnEdit}
                onPlanMeal={mockOnPlanMeal}
                onAddToShoppingList={mockOnAddToShoppingList}
                onRandomMeal={mockOnRandomMeal}
                mealPlans={[]}
            />
        );

        // Click Handla (Shopping list) - should add to shopping list first, then show prompt
        const shopBtn = screen.getByRole('button', { name: /Handla/i });
        fireEvent.click(shopBtn);
        
        // Should have added to shopping list
        expect(mockOnAddToShoppingList).toHaveBeenCalledWith(mockMeal);
        
        // Click "Ja" - should plan the meal (async due to state update)
        const yesBtn = await screen.findByText('Ja');
        fireEvent.click(yesBtn);
        expect(mockOnPlanMeal).toHaveBeenCalledWith(mockMeal);
    });

    it('does not show prompt when meal is already planned', () => {
        const mockMealPlans: MealPlan[] = [{
            id: 'mp-1',
            name: 'Vecka 1',
            days: [{
                date: '2025-01-01',
                meals: [{
                    type: 'dinner',
                    plannedMeal: { customTitle: 'Ugnsbakad Lax' }
                }]
            }]
        }];

        render(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={mockMeal}
                onEdit={mockOnEdit}
                onPlanMeal={mockOnPlanMeal}
                onAddToShoppingList={mockOnAddToShoppingList}
                onRandomMeal={mockOnRandomMeal}
                mealPlans={mockMealPlans}
            />
        );

        // Click Handla (Shopping list) - should add to shopping list and NOT show prompt
        const shopBtn = screen.getByRole('button', { name: /Handla/i });
        fireEvent.click(shopBtn);
        
        // Should have added to shopping list
        expect(mockOnAddToShoppingList).toHaveBeenCalledWith(mockMeal);
        
        // Should NOT show the prompt since meal is already planned
        expect(screen.queryByText('Vill du också planera in denna måltid?')).not.toBeInTheDocument();
        expect(mockOnPlanMeal).not.toHaveBeenCalled();
    });
});
