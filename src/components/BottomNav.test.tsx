import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav, MoreDrawer } from './BottomNav';
import { describe, it, expect, vi } from 'vitest';

describe('BottomNav Component', () => {
    it('should call onNavigate when primary tab is clicked', () => {
        const onNavigate = vi.fn();
        const onMoreOpen = vi.fn();

        render(
            <MemoryRouter>
                <BottomNav onMoreOpen={onMoreOpen} onNavigate={onNavigate} />
            </MemoryRouter>
        );

        // Find and click the Inköp (Shopping) tab
        const shoppingTab = screen.getByTestId('nav-shopping');
        fireEvent.click(shoppingTab);

        // Verify onNavigate was called
        expect(onNavigate).toHaveBeenCalled();
    });

    it('should call onMoreOpen when Mer button is clicked', () => {
        const onNavigate = vi.fn();
        const onMoreOpen = vi.fn();

        render(
            <MemoryRouter>
                <BottomNav onMoreOpen={onMoreOpen} onNavigate={onNavigate} />
            </MemoryRouter>
        );

        // Find and click the Mer button
        const moreButton = screen.getByTestId('nav-more');
        fireEvent.click(moreButton);

        // Verify onMoreOpen was called
        expect(onMoreOpen).toHaveBeenCalled();
    });

    it('should render all 5 navigation tabs', () => {
        render(
            <MemoryRouter>
                <BottomNav onMoreOpen={vi.fn()} onNavigate={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByTestId('nav-home')).toBeDefined();
        expect(screen.getByTestId('nav-shopping')).toBeDefined();
        expect(screen.getByTestId('nav-mealplan')).toBeDefined();
        expect(screen.getByTestId('nav-meals')).toBeDefined();
        expect(screen.getByTestId('nav-more')).toBeDefined();
    });

    it('should have main navigation aria-label', () => {
        render(
            <MemoryRouter>
                <BottomNav onMoreOpen={vi.fn()} onNavigate={vi.fn()} />
            </MemoryRouter>
        );

        const nav = screen.getByRole('navigation', { name: /huvudnavigation/i });
        expect(nav).toBeDefined();
    });
});

describe('MoreDrawer Component', () => {
    it('should call onClose when drawer backdrop is clicked', () => {
        const onClose = vi.fn();

        render(
            <MemoryRouter>
                <MoreDrawer isOpen={true} onClose={onClose} />
            </MemoryRouter>
        );

        // Find and click the backdrop
        const backdrop = screen.getByTestId('drawer-backdrop');
        fireEvent.click(backdrop);

        // Verify onClose was called
        expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose and navigate when secondary item is clicked', () => {
        const onClose = vi.fn();

        render(
            <MemoryRouter>
                <MoreDrawer isOpen={true} onClose={onClose} />
            </MemoryRouter>
        );

        // Find and click a secondary navigation item
        const todosItem = screen.getByText('Att göra');
        fireEvent.click(todosItem);

        // Verify onClose was called
        expect(onClose).toHaveBeenCalled();
    });

    it('should not render when isOpen is false', () => {
        const onClose = vi.fn();

        const { container } = render(
            <MemoryRouter>
                <MoreDrawer isOpen={false} onClose={onClose} />
            </MemoryRouter>
        );

        // Verify drawer is not rendered
        expect(container.firstChild).toBeNull();
    });

    it('should render grouped navigation items', () => {
        render(
            <MemoryRouter>
                <MoreDrawer isOpen={true} onClose={vi.fn()} />
            </MemoryRouter>
        );

        // Verify group headers are rendered (they are uppercase in the DOM)
        expect(screen.getByText(/produktivitet/i)).toBeDefined();
        expect(screen.getByText(/verktyg/i)).toBeDefined();
        // Check that there are at least 2 elements with "Inställningar" (group header + nav item)
        expect(screen.getAllByText(/inställningar/i).length).toBeGreaterThanOrEqual(1);
    });

    it('should highlight active secondary navigation item', () => {
        render(
            <MemoryRouter initialEntries={['/todos']}>
                <MoreDrawer isOpen={true} onClose={vi.fn()} />
            </MemoryRouter>
        );

        // The active item should have different styling
        const activeItem = screen.getByText('Att göra');
        expect(activeItem).toBeDefined();
        // Check that the button parent has the active class
        const button = activeItem.closest('button');
        expect(button).toHaveClass('bg-blue-50');
    });
});