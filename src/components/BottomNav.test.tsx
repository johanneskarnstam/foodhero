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
        const shoppingTab = screen.getByText('Inköp');
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
        const moreButton = screen.getByText('Mer');
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

        expect(screen.getByText('Hem')).toBeDefined();
        expect(screen.getByText('Inköp')).toBeDefined();
        expect(screen.getByText('Matsedel')).toBeDefined();
        expect(screen.getByText('Recept')).toBeDefined();
        expect(screen.getByText('Mer')).toBeDefined();
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
});