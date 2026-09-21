import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MealDetailModal } from './MealDetailModal';
import { Meal, MealPlan } from '../types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultTextOrOptions?: string | Record<string, unknown>, options?: Record<string, unknown>) => {
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
                'common.random': 'Slumpa ny',
                'timers.start': 'Starta timer',
                'timers.done': 'Klart!',
                'timers.startTimerFor': 'Starta timer ({{time}})',
                'meals.fetchRecipeWithAIButton': 'Hämta recept med AI',
                'meals.enrichingWithAI': 'Kompletterar med AI...',
                'meals.missingIngredientsAndInstructions': 'Receptet saknar både ingredienser och instruktioner.',
                'meals.missingIngredients': 'Receptet saknar ingredienser.',
                'meals.missingInstructions': 'Receptet saknar instruktioner.',
                'meals.fetchRecipeWithAI': 'Vill du hämta och komplettera receptet med hjälp av AI?'
            };
            if (translations[key]) {
                const opts = (typeof defaultTextOrOptions === 'object' ? defaultTextOrOptions : options) as Record<string, string> | undefined;
                let text = translations[key];
                if (opts) {
                    Object.entries(opts).forEach(([k, v]) => {
                        text = text.replace(`{{${k}}}`, String(v));
                    });
                }
                return text;
            }
            if (typeof defaultTextOrOptions === 'string') return defaultTextOrOptions;
            return key;
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

    it('calls onTagClick when a meal tag is clicked', () => {
        const mockOnTagClick = vi.fn();

        render(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={mockMeal}
                onTagClick={mockOnTagClick}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Fisk' }));

        expect(mockOnTagClick).toHaveBeenCalledWith('Fisk');
    });

    it('opens the AI help modal from the recipe actions', () => {
        render(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={mockMeal}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Fråga AI/i }));

        expect(screen.getByRole('heading', { name: 'recipeAiHelp.title' })).toBeInTheDocument();
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

    it('detects cooking times and starts a timer in instructions tab', () => {
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

        // Step 2 has "Baka i ugnen i 20 minuter", timer button should be displayed
        const timerButton = screen.getByRole('button', { name: /20 min/i });
        expect(timerButton).toBeInTheDocument();

        // Timer bar should not be visible before clicking
        expect(screen.queryByTestId('recipe-timer-bar')).not.toBeInTheDocument();

        // Click to start timer
        fireEvent.click(timerButton);

        // Timer bar should now be visible
        expect(screen.getByTestId('recipe-timer-bar')).toBeInTheDocument();
        expect(screen.getByText('20:00')).toBeInTheDocument();
    });

    it('renders "Hämta recept med AI" button when recipe data is missing and onFetchAIRecipe is provided', () => {
        const incompleteMeal: Meal = {
            id: 'm-empty',
            name: 'Pannkakor',
            createdAt: ''
        };
        const mockOnFetchAIRecipe = vi.fn();

        render(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={incompleteMeal}
                onFetchAIRecipe={mockOnFetchAIRecipe}
            />
        );

        expect(screen.getByText('Receptet saknar både ingredienser och instruktioner.')).toBeInTheDocument();
        const aiButton = screen.getByRole('button', { name: /Hämta recept med AI/i });
        expect(aiButton).toBeInTheDocument();
        expect(aiButton).not.toBeDisabled();

        fireEvent.click(aiButton);
        expect(mockOnFetchAIRecipe).toHaveBeenCalledWith(incompleteMeal);
    });

    it('disables the AI button and shows loading text and spinner when isAiLoading is true', () => {
        const incompleteMeal: Meal = {
            id: 'm-empty',
            name: 'Pannkakor',
            createdAt: ''
        };
        const mockOnFetchAIRecipe = vi.fn();

        render(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={incompleteMeal}
                onFetchAIRecipe={mockOnFetchAIRecipe}
                isAiLoading={true}
            />
        );

        const aiButton = screen.getByRole('button', { name: /Kompletterar med AI.../i });
        expect(aiButton).toBeInTheDocument();
        expect(aiButton).toBeDisabled();

        // Clicking while disabled should not trigger callback
        fireEvent.click(aiButton);
        expect(mockOnFetchAIRecipe).not.toHaveBeenCalled();
    });

    it('shows specific missing message when only ingredients or instructions are missing', () => {
        const mealMissingIngredients: Meal = {
            id: 'm-no-ing',
            name: 'Köttbullar',
            instructions: ['Stek köttbullarna'],
            createdAt: ''
        };
        const mockOnFetchAIRecipe = vi.fn();

        const { rerender } = render(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={mealMissingIngredients}
                onFetchAIRecipe={mockOnFetchAIRecipe}
            />
        );

        expect(screen.getByText('Receptet saknar ingredienser.')).toBeInTheDocument();

        const mealMissingInstructions: Meal = {
            id: 'm-no-inst',
            name: 'Köttbullar',
            ingredients: [{ text: 'Köttfärs', amount: '500g' }],
            createdAt: ''
        };

        rerender(
            <MealDetailModal
                isOpen={true}
                onClose={mockOnClose}
                meal={mealMissingInstructions}
                onFetchAIRecipe={mockOnFetchAIRecipe}
            />
        );

        expect(screen.getByText('Receptet saknar instruktioner.')).toBeInTheDocument();
    });
});

