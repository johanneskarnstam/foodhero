import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MealsView } from './MealsView';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Meal } from '../types';
import { describe, it, expect, vi, beforeEach } from 'vitest';


vi.mock('../context/AppContext');
vi.mock('../context/ToastContext');
const mockUseSearchParams = vi.hoisted(() => vi.fn(() => [new URLSearchParams(), vi.fn()] as const));
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useSearchParams: () => mockUseSearchParams(),
}));

const mockMeals: Meal[] = [
    {
        id: '1',
        name: 'Köttfärssås & Spaghetti',
        description: 'Enkel vardagsfavorit',
        tags: ['Pasta', 'Kött', 'Snabbt'],
        ingredients: [
            { text: 'Köttfärs', amount: '500g' },
            { text: 'Spaghetti', amount: '400g' }
        ],
        createdAt: ''
    },
    {
        id: '2',
        name: 'Vegetarisk Lasagne',
        description: 'Lasagne med spenat och fetaost',
        tags: ['Vegetariskt', 'Pasta'],
        ingredients: [
            { text: 'Lasagneplattor', amount: '1 pkt' },
            { text: 'Spenat', amount: '250g' }
        ],
        createdAt: ''
    }
];

describe('MealsView', () => {
    const mockShowToast = vi.fn();
    const mockAddMeal = vi.fn();
    const mockUpdateMeal = vi.fn();
    const mockDeleteMeal = vi.fn();
    const mockAddItemsToList = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);

        vi.mocked(useToast).mockReturnValue({
            showToast: mockShowToast,
        } as unknown as ReturnType<typeof useToast>);

        vi.mocked(useApp).mockReturnValue({
            meals: mockMeals,
            addMeal: mockAddMeal,
            updateMeal: mockUpdateMeal,
            deleteMeal: mockDeleteMeal,
            addItemsToList: mockAddItemsToList,
            defaultListId: 'list-1',
            mealPlans: [],
            addMealPlan: vi.fn(),
            updateMealPlan: vi.fn(),
        } as unknown as ReturnType<typeof useApp>);
    });

    it('renders all saved meals', () => {
        render(<MealsView />);

        expect(screen.getByText('Recept & Måltider')).toBeInTheDocument();
        expect(screen.getByText('Köttfärssås & Spaghetti')).toBeInTheDocument();
        expect(screen.getByText('Vegetarisk Lasagne')).toBeInTheDocument();
    });

    it('filters meals by search query', () => {
        render(<MealsView />);

        const searchInput = screen.getByPlaceholderText(/Sök bland recept/i);
        fireEvent.change(searchInput, { target: { value: 'lasagne' } });

        expect(screen.getByText('Vegetarisk Lasagne')).toBeInTheDocument();
        expect(screen.queryByText('Köttfärssås & Spaghetti')).not.toBeInTheDocument();
    });

    it('filters meals by tag clicking', () => {
        render(<MealsView />);

        const meatTagBtn = screen.getByRole('button', { name: /Kött/i });
        fireEvent.click(meatTagBtn);

        expect(screen.getByText('Köttfärssås & Spaghetti')).toBeInTheDocument();
        expect(screen.queryByText('Vegetarisk Lasagne')).not.toBeInTheDocument();
    });

    it('filters meals by a tag from the URL', () => {
        mockUseSearchParams.mockReturnValue([new URLSearchParams('tag=Pasta'), vi.fn()]);

        render(<MealsView />);

        expect(screen.getByText('Köttfärssås & Spaghetti')).toBeInTheDocument();
        expect(screen.getByText('Vegetarisk Lasagne')).toBeInTheDocument();
    });

    it('opens MealEditModal when clicking "Skapa recept"', () => {
        render(<MealsView />);

        const createBtn = screen.getByRole('button', { name: /Skapa recept/i });
        fireEvent.click(createBtn);

        expect(screen.getByText('Skapa nytt recept')).toBeInTheDocument();
    });

    it('opens MealDetailModal when clicking on a recipe card', () => {
        render(<MealsView />);

        const card = screen.getByText('Köttfärssås & Spaghetti');
        fireEvent.click(card);

        // MealDetailModal opens
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Handla/i })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /Planera/i }).length).toBeGreaterThan(1);
    });
});
