import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomeView } from './HomeView';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApp } from '../context/AppContext';
import { useMealPlan } from '../hooks/useMealPlan';
import { useToast } from '../context/ToastContext';
import { useAiRecipe } from '../hooks/useAiRecipe';

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

vi.mock('../hooks/useAiRecipe', () => ({
    useAiRecipe: vi.fn(),
}));

vi.mock('../context/ToastContext', () => ({
    useToast: vi.fn(),
}));

vi.mock('./MealDetailModal', () => ({
    MealDetailModal: () => null,
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
                'dashboard.quickAddPlaceholder': 'Lägg till matvara...',
                'dashboard.quickAddButton': 'Lägg till',
                'dashboard.itemAdded': 'Varan lades till i inköpslistan',
                'errors.emptyItem': 'Du måste ange en vara',
                'errors.failedToAddItem': 'Misslyckades att lägga till varan',
                'common.clear': 'Rensa',
                'common.close': 'Stäng',
                'common.servings': 'portioner',
                'meals.ingredients': 'Ingredienser',
                'meals.preparation': 'Tillagning',
                'meals.noIngredients': 'Inga ingredienser listade.',
                'meals.noInstructions': 'Inga tillagningssteg listade.',
                'meals.unknownMeal': 'Okänd måltid',
                'meals.noRecipeFound': 'Ingen receptinformation hittades för denna måltid.',
                'meals.fetchRecipeWithAI': 'Vill du hämta och komplettera receptet med hjälp av AI?',
                'meals.fetchRecipeWithAIButton': 'Hämta recept med AI',
                'meals.recipeFetchedWithAI': 'Receptet har hämtats och kompletterats med AI',
                'meals.addedToShoppingList': 'Ingredienser lades till i inköpslistan',
                'mealTypes.dinner': 'middag',
                'mealTypes.lunch': 'lunch',
                'meals.plannedInfo': 'Planerad: {{dates}}',
                'days.sunday': 'söndag',
                'days.monday': 'måndag',
                'days.tuesday': 'tisdag',
                'days.wednesday': 'onsdag',
                'days.thursday': 'torsdag',
                'days.friday': 'fredag',
                'days.saturday': 'lördag',
                'days.today': 'idag',
                'days.tomorrow': 'imorgon',
            };
            return translations[key] || key;
        },
    }),
}));

describe('HomeView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useToast).mockReturnValue({ showToast: vi.fn() });
        vi.mocked(useApp).mockReturnValue({
            lists: [
                {
                    id: 'default-list',
                    items: [],
                    settings: {},
                },
            ],
            defaultListId: 'default-list',
            addItemsToList: vi.fn(),
            itemHistory: [],
            meals: [],
        } as unknown as ReturnType<typeof useApp>);

        vi.mocked(useMealPlan).mockReturnValue({
            getPlanForDate: vi.fn().mockReturnValue(null),
            mealPlans: [],
        } as unknown as ReturnType<typeof useMealPlan>);

        vi.mocked(useAiRecipe).mockReturnValue({
            enrichMeal: vi.fn().mockResolvedValue(null),
        } as unknown as ReturnType<typeof useAiRecipe>);
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
            meals: [],
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
            meals: [],
        } as unknown as ReturnType<typeof useApp>);

        render(
            <MemoryRouter>
                <HomeView />
            </MemoryRouter>
        );

        expect(screen.getAllByText('Allt är inhandlat! 🎉').length).toBeGreaterThan(0);
    });

    it('renders planned meal and opens meal detail modal on click', () => {
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

        vi.mocked(useApp).mockReturnValue({
            lists: [{ id: 'default-list', items: [], settings: {} }],
            defaultListId: 'default-list',
            addItemsToList: vi.fn(),
            itemHistory: [],
            meals: [],
        } as unknown as ReturnType<typeof useApp>);

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

        // Click meal plan card - should open modal, not navigate
        const mealCard = screen.getByText('Måltidsplanering').closest('[role="button"]')!;
        fireEvent.click(mealCard);
        // Since MealDetailModal is mocked, we just verify that navigation did not occur
        expect(mockNavigate).not.toHaveBeenCalled();
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

        // For meal plan card without a planned meal, it should navigate to /mealplan
        const mealCard = screen.getByText('Måltidsplanering').closest('[role="button"]')!;
        fireEvent.keyDown(mealCard, { key: ' ' });
        expect(mockNavigate).toHaveBeenCalledWith('/mealplan');
    });

    describe('Quick Add Feature', () => {
        const mockAddItemsToList = vi.fn();
        const mockShowToast = vi.fn();

        beforeEach(() => {
            vi.clearAllMocks();
            vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast });
            vi.mocked(useApp).mockReturnValue({
                lists: [{ id: '1', items: [], settings: {} }],
                defaultListId: '1',
                addItemsToList: mockAddItemsToList,
                itemHistory: [],
                meals: [],
            } as unknown as ReturnType<typeof useApp>);
            vi.mocked(useMealPlan).mockReturnValue({
                getPlanForDate: vi.fn().mockReturnValue(null),
                mealPlans: [],
            } as unknown as ReturnType<typeof useMealPlan>);
        });

        it('should render the quick add input field', () => {
            render(
                <MemoryRouter>
                    <HomeView />
                </MemoryRouter>
            );
            expect(screen.getByPlaceholderText('Lägg till matvara...')).toBeInTheDocument();
        });

        it('should show clear button when input is not empty', async () => {
            render(
                <MemoryRouter>
                    <HomeView />
                </MemoryRouter>
            );
            const input = screen.getByPlaceholderText('Lägg till matvara...');
            fireEvent.change(input, { target: { value: 'Mjölk' } });
            expect(screen.getByLabelText('Rensa')).toBeInTheDocument();
        });

        it('should clear input when clear button is clicked', async () => {
            render(
                <MemoryRouter>
                    <HomeView />
                </MemoryRouter>
            );
            const input = screen.getByPlaceholderText('Lägg till matvara...');
            fireEvent.change(input, { target: { value: 'Mjölk' } });
            fireEvent.click(screen.getByLabelText('Rensa'));
            expect(input).toHaveValue('');
        });

        it('should show error toast when trying to add empty item', async () => {
            render(
                <MemoryRouter>
                    <HomeView />
                </MemoryRouter>
            );
            const input = screen.getByPlaceholderText('Lägg till matvara...');
            fireEvent.submit(input);

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    'Du måste ange en vara',
                    'error'
                );
            });
        });

        it('should add item and show success toast', async () => {
            render(
                <MemoryRouter>
                    <HomeView />
                </MemoryRouter>
            );
            const input = screen.getByPlaceholderText('Lägg till matvara...');
            fireEvent.change(input, { target: { value: 'Mjölk' } });
            fireEvent.submit(input);

            await waitFor(() => {
                expect(mockAddItemsToList).toHaveBeenCalledWith('1', [
                    expect.objectContaining({ text: 'Mjölk', completed: false })
                ]);
                expect(mockShowToast).toHaveBeenCalledWith(
                    'Varan lades till i inköpslistan',
                    'success'
                );
            });
        });

        it('should show autocomplete suggestions', async () => {
            vi.mocked(useApp).mockReturnValue({
                lists: [{ id: '1', items: [], settings: {} }],
                defaultListId: '1',
                addItemsToList: mockAddItemsToList,
                itemHistory: [
                    { id: '1', text: 'Mjölk', usageCount: 5, lastUsed: '' },
                    { id: '2', text: 'Bröd', usageCount: 3, lastUsed: '' },
                ],
                meals: [],
            } as unknown as ReturnType<typeof useApp>);

            render(
                <MemoryRouter>
                    <HomeView />
                </MemoryRouter>
            );
            const input = screen.getByPlaceholderText('Lägg till matvara...');
            fireEvent.change(input, { target: { value: 'M' } });

            await waitFor(() => {
                const suggestion = screen.queryByText('Mjölk');
                expect(suggestion).toBeInTheDocument();
            });
        });

        it('should select suggestion and add item', async () => {
            vi.mocked(useApp).mockReturnValue({
                lists: [{ id: '1', items: [], settings: {} }],
                defaultListId: '1',
                addItemsToList: mockAddItemsToList,
                itemHistory: [
                    { id: '1', text: 'Mjölk', usageCount: 5, lastUsed: '' },
                ],
                meals: [],
            } as unknown as ReturnType<typeof useApp>);

            render(
                <MemoryRouter>
                    <HomeView />
                </MemoryRouter>
            );
            const input = screen.getByPlaceholderText('Lägg till matvara...');
            fireEvent.change(input, { target: { value: 'M' } });

            await waitFor(() => {
                const suggestion = screen.getByText('Mjölk');
                fireEvent.click(suggestion);
            });

            await waitFor(() => {
                expect(mockAddItemsToList).toHaveBeenCalledWith('1', [
                    expect.objectContaining({ text: 'Mjölk', completed: false })
                ]);
            });
        });
    });
});
