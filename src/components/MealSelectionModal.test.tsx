import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MealSelectionModal } from './MealSelectionModal';
import { Meal, MealPlan } from '../types';
import { describe, it, expect, vi } from 'vitest';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'mealSelection.title': 'Välj måltid',
                'mealSelection.subtitle': 'Välj en måltid från dina favoriter eller skriv in en ny.',
                'mealSelection.noMealsFound': 'Inga sparade måltider hittades.',
                'mealSelection.plannedSoon': 'Planerad snart',
                'common.close': 'Stäng'
            };
            return translations[key] || key;
        }
    })
}));

const mockMeals: Meal[] = [
    { id: '1', name: 'Pasta Carbonara', createdAt: '2023-01-01' },
    { id: '2', name: 'Tacos', createdAt: '2023-01-01' },
    { id: '3', name: 'Lax med potatis', createdAt: '2023-01-01' },
];

const mockMealPlans: MealPlan[] = [
    {
        id: 'plan1',
        weekNumber: 34,
        year: 2026,
        days: [
            {
                date: new Date().toISOString().split('T')[0],
                meals: [
                    { type: 'dinner', plannedMeal: { id: 'pm1', customTitle: 'Pasta Carbonara' } }
                ]
            }
        ]
    }
];

describe('MealSelectionModal', () => {
    it('renders all meals from the library', () => {
        render(
            <MealSelectionModal 
                isOpen={true} 
                onClose={() => {}} 
                meals={mockMeals} 
                mealPlans={[]} 
                onSelect={() => {}} 
            />
        );

        expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
        expect(screen.getByText('Tacos')).toBeInTheDocument();
        expect(screen.getByText('Lax med potatis')).toBeInTheDocument();
    });

    it('marks meals that are planned in the next 10 days', () => {
        render(
            <MealSelectionModal 
                isOpen={true} 
                onClose={() => {}} 
                meals={mockMeals} 
                mealPlans={mockMealPlans} 
                onSelect={() => {}} 
            />
        );

        expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
        expect(screen.getByText('Planerad snart')).toBeInTheDocument();
        expect(screen.queryByText('Tacos')).toBeInTheDocument();
        // Tacos should not have "Planerad snart" next to it specifically in a way that matches the text search if we are careful, 
        // but we can check that only one "Planerad snart" exists.
        const plannedMarkers = screen.getAllByText('Planerad snart');
        expect(plannedMarkers).toHaveLength(1);
    });

    it('calls onSelect when a meal is clicked', () => {
        const onSelectMock = vi.fn();
        render(
            <MealSelectionModal 
                isOpen={true} 
                onClose={() => {}} 
                meals={mockMeals} 
                mealPlans={[]} 
                onSelect={onSelectMock} 
            />
        );

        fireEvent.click(screen.getByText('Tacos'));
        expect(onSelectMock).toHaveBeenCalledWith('Tacos');
    });

    it('shows empty state when no meals are available', () => {
        render(
            <MealSelectionModal 
                isOpen={true} 
                onClose={() => {}} 
                meals={[]} 
                mealPlans={[]} 
                onSelect={() => {}} 
            />
        );

        expect(screen.getByText('Inga sparade måltider hittades.')).toBeInTheDocument();
    });
});