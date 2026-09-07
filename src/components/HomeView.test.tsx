import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomeView } from './HomeView';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApp } from '../context/AppContext';
import { useMealPlan } from '../hooks/useMealPlan';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../context/AppContext', () => ({
    useApp: vi.fn(),
}));

vi.mock('../hooks/useMealPlan', () => ({
    useMealPlan: vi.fn(),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown> | string) => {
            if (typeof options === 'string') return options;
            if (options && typeof options === 'object' && 'count' in options) {
                if (key === 'dashboard.itemsLeft') {
                    return `${options.count} varor kvar att handla`;
                }
                if (key === 'dashboard.moreItems') {
                    return `+${options.count} till`;
                }
            }
            const translations: Record<string, string> = {
                'dashboard.title': 'Hem',
                'dashboard.shoppingTitle': 'Inköpslista',
                'dashboard.emptyList': 'Inköpslistan är tom',
                'dashboard.allDone': 'Allt är inhandlat! 🎉',
                'dashboard.mealPlanTitle': 'Måltidsplanering',
                'dashboard.todayDinner': 'Dagens middag',
                'dashboard.tomorrowDinner': 'Morgondagens middag',
                'dashboard.noMealsPlannedPrompt': 'Hey, hittar inga planerade måltider, dags att planera matsedeln!',
            };
            return translations[key] || key;
        },
    }),
}));

describe('HomeView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useApp).mockReturnValue({
            lists: [
                {
                    id: 'default-list',
                    items: [],
                    settings: {},
                },
            ],
            defaultListId: 'default-list',
        } as unknown as ReturnType<typeof useApp>);

        vi.mocked(useMealPlan).mockReturnValue({
            getPlanForDate: vi.fn().mockReturnValue(null),
            mealPlans: [],
        } as unknown as ReturnType<typeof useMealPlan>);
    });

    it('renders header and empty states when list and mealplan are empty', () => {
        render(
            <MemoryRouter>
                <HomeView />
            </MemoryRouter>
        );

        expect(screen.getByText('Hem')).toBeDefined();
        expect(screen.getByText('Inköpslista')).toBeDefined();
        expect(screen.getByText('0 varor kvar att handla')).toBeDefined();
        expect(screen.getByText('Inköpslistan är tom')).toBeDefined();
        expect(screen.getByText('Måltidsplanering')).toBeDefined();
        expect(screen.getByText('Hey, hittar inga planerade måltider, dags att planera matsedeln!')).toBeDefined();
    });

    it('renders preview of items and more indicator, navigating to /shopping on click', () => {
        vi.mocked(useApp).mockReturnValue({
            lists: [
                {
                    id: 'default-list',
                    items: [
                        { id: '1', text: 'Mjölk', completed: false },
                        { id: '2', text: 'Bröd', completed: false },
                        { id: '3', text: 'Smör', completed: false },
                        { id: '4', text: 'Ägg', completed: false },
                        { id: '5', text: 'Kaffe', completed: false },
                        { id: '6', text: 'Ost', completed: true },
                    ],
                    settings: {},
                },
            ],
            defaultListId: 'default-list',
        } as unknown as ReturnType<typeof useApp>);

        render(
            <MemoryRouter>
                <HomeView />
            </MemoryRouter>
        );

        // Should show preview of first 4 items
        expect(screen.getByText('Mjölk')).toBeDefined();
        expect(screen.getByText('Bröd')).toBeDefined();
        expect(screen.getByText('Smör')).toBeDefined();
        expect(screen.getByText('Ägg')).toBeDefined();
        expect(screen.queryByText('Kaffe')).toBeNull(); // 5th item is behind "+1 till"

        // Indicator for more items (5 uncompleted, 4 shown -> +1 till)
        expect(screen.getByText('+1 till')).toBeDefined();
        expect(screen.getByText('5 varor kvar att handla')).toBeDefined();

        // Click shopping card to navigate
        const shoppingCard = screen.getByText('Inköpslista').closest('[role="button"]')!;
        fireEvent.click(shoppingCard);
        expect(mockNavigate).toHaveBeenCalledWith('/shopping');
    });

    it('renders all completed state when all items are done', () => {
        vi.mocked(useApp).mockReturnValue({
            lists: [
                {
                    id: 'default-list',
                    items: [
                        { id: '1', text: 'Mjölk', completed: true },
                        { id: '2', text: 'Bröd', completed: true },
                    ],
                    settings: {},
                },
            ],
            defaultListId: 'default-list',
        } as unknown as ReturnType<typeof useApp>);

        render(
            <MemoryRouter>
                <HomeView />
            </MemoryRouter>
        );

        expect(screen.getAllByText('Allt är inhandlat! 🎉').length).toBeGreaterThan(0);
    });

    it('renders planned meal and navigates to /mealplan on click', () => {
        const mockGetPlan = vi.fn().mockReturnValue({
            id: 'plan-1',
            weekNumber: 1,
            year: 2026,
            days: [
                {
                    date: new Date().toISOString().split('T')[0],
                    meals: [
                        {
                            type: 'dinner',
                            plannedMeal: {
                                id: 'm1',
                                customTitle: 'Lasagne al Forno',
                            },
                        },
                    ],
                },
            ],
        });

        vi.mocked(useMealPlan).mockReturnValue({
            getPlanForDate: mockGetPlan,
            mealPlans: [],
        } as unknown as ReturnType<typeof useMealPlan>);

        render(
            <MemoryRouter>
                <HomeView />
            </MemoryRouter>
        );

        expect(screen.getByText('Lasagne al Forno')).toBeDefined();

        // Click meal plan card
        const mealCard = screen.getByText('Måltidsplanering').closest('[role="button"]')!;
        fireEvent.click(mealCard);
        expect(mockNavigate).toHaveBeenCalledWith('/mealplan');
    });

    it('supports keyboard navigation via Enter and Space keys', () => {
        render(
            <MemoryRouter>
                <HomeView />
            </MemoryRouter>
        );

        const shoppingCard = screen.getByText('Inköpslista').closest('[role="button"]')!;
        fireEvent.keyDown(shoppingCard, { key: 'Enter' });
        expect(mockNavigate).toHaveBeenCalledWith('/shopping');

        const mealCard = screen.getByText('Måltidsplanering').closest('[role="button"]')!;
        fireEvent.keyDown(mealCard, { key: ' ' });
        expect(mockNavigate).toHaveBeenCalledWith('/mealplan');
    });
});
