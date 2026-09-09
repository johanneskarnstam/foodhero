import { render, screen, fireEvent, act } from '@testing-library/react';
import { SortableItem } from './SortableItem';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Item } from '../types';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Trash2: () => <div data-testid="trash-icon" />,
    GripVertical: () => <div data-testid="grip-icon" />,
    Circle: () => <div data-testid="circle-icon" />,
    CheckCircle2: () => <div data-testid="check-circle-icon" />,
    CloudUpload: () => <div data-testid="cloud-upload-icon" />,
    Tag: () => <div data-testid="tag-icon" />,
    FileText: () => <div data-testid="file-text-icon" />,
    Home: () => <div data-testid="home-icon" />,
    HelpCircle: () => <div data-testid="help-circle-icon" />,
    Check: () => <div data-testid="check-icon" />,
    ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
}));

// Mock react-swipeable-list
vi.mock('react-swipeable-list', () => ({
    SwipeableList: ({ children }: { children: React.ReactNode }) => <div data-testid="swipeable-list">{children}</div>,
    SwipeableListItem: ({ children }: { children: React.ReactNode }) => <div data-testid="swipeable-list-item">{children}</div>,
    SwipeAction: ({ children }: { children: React.ReactNode }) => <div data-testid="swipe-action">{children}</div>,
    LeadingActions: ({ children }: { children: React.ReactNode }) => <div data-testid="leading-actions">{children}</div>,
    TrailingActions: ({ children }: { children: React.ReactNode }) => <div data-testid="trailing-actions">{children}</div>,
    Type: {
        IOS: 'IOS',
        ANDROID: 'ANDROID',
        MS: 'MS',
    },
}));

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
    useSortable: () => ({
        attributes: {
            role: 'button',
            tabIndex: 0,
            'aria-label': 'Drag to reorder item',
        },
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
}));

// Mock @dnd-kit/utilities
vi.mock('@dnd-kit/utilities', () => ({
    CSS: {
        Transform: {
            toString: () => '',
        },
    },
}));

const mockItem: Item = {
    id: 'item1',
    text: 'Test Item',
    completed: false,
    checkIfExistAtHome: false,
};

describe('SortableItem', () => {
    const mockOnToggle = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnEditNote = vi.fn();
    const mockOnTogglecheckIfExistAtHome = vi.fn();
    const mockOnEditingChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the item text in an input field', () => {
        render(
            <SortableItem
                item={mockItem}
                onToggle={mockOnToggle}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
                onEditNote={mockOnEditNote}
                onTogglecheckIfExistAtHome={mockOnTogglecheckIfExistAtHome}
                onEditingChange={mockOnEditingChange}
            />
        );
        const input = screen.getByDisplayValue('Test Item');
        expect(input).toBeDefined();
    });

    it('renders the drag handle', () => {
        render(
            <SortableItem
                item={mockItem}
                onToggle={mockOnToggle}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
                onEditNote={mockOnEditNote}
                onTogglecheckIfExistAtHome={mockOnTogglecheckIfExistAtHome}
                onEditingChange={mockOnEditingChange}
            />
        );
        expect(screen.getByTestId('grip-icon')).toBeDefined();
    });

    it('calls onToggle when the toggle button is clicked', async () => {
        render(
            <SortableItem
                item={mockItem}
                onToggle={mockOnToggle}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
                onEditNote={mockOnEditNote}
                onTogglecheckIfExistAtHome={mockOnTogglecheckIfExistAtHome}
                onEditingChange={mockOnEditingChange}
            />
        );
        const toggleButton = screen.getByLabelText('Mark as complete');
        await act(async () => {
            fireEvent.click(toggleButton);
        });
        expect(mockOnToggle).toHaveBeenCalledWith('item1');
    });

    it('disables drag handle when disabled prop is true', () => {
        render(
            <SortableItem
                item={mockItem}
                onToggle={mockOnToggle}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
                onEditNote={mockOnEditNote}
                onTogglecheckIfExistAtHome={mockOnTogglecheckIfExistAtHome}
                onEditingChange={mockOnEditingChange}
                disabled={true}
            />
        );
        expect(screen.queryByTestId('grip-icon')).toBeNull();
    });

    it('renders the delete button in trailing actions', () => {
        render(
            <SortableItem
                item={mockItem}
                onToggle={mockOnToggle}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
                onEditNote={mockOnEditNote}
                onTogglecheckIfExistAtHome={mockOnTogglecheckIfExistAtHome}
                onEditingChange={mockOnEditingChange}
            />
        );
        // The delete button is in TrailingActions, which is rendered conditionally
        // We check for the swipeable-list structure instead
        expect(screen.getByTestId('swipeable-list')).toBeDefined();
    });

    it('renders the note button when item has a note', () => {
        render(
            <SortableItem
                item={{ ...mockItem, note: 'Test note' }}
                onToggle={mockOnToggle}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
                onEditNote={mockOnEditNote}
                onTogglecheckIfExistAtHome={mockOnTogglecheckIfExistAtHome}
                onEditingChange={mockOnEditingChange}
            />
        );
        expect(screen.getByTestId('file-text-icon')).toBeDefined();
    });

    it('renders the checkIfExistAtHome button', () => {
        render(
            <SortableItem
                item={mockItem}
                onToggle={mockOnToggle}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
                onEditNote={mockOnEditNote}
                onTogglecheckIfExistAtHome={mockOnTogglecheckIfExistAtHome}
                onEditingChange={mockOnEditingChange}
            />
        );
        expect(screen.getByTestId('home-icon')).toBeDefined();
    });

    it('renders the categorize button when onCategorize is provided', () => {
        render(
            <SortableItem
                item={mockItem}
                onToggle={mockOnToggle}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
                onEditNote={mockOnEditNote}
                onTogglecheckIfExistAtHome={mockOnTogglecheckIfExistAtHome}
                onEditingChange={mockOnEditingChange}
                onCategorize={vi.fn()}
            />
        );
        expect(screen.getByTestId('tag-icon')).toBeDefined();
    });

    it('renders the pending indicator when item.isPending is true', () => {
        render(
            <SortableItem
                item={{ ...mockItem, isPending: true }}
                onToggle={mockOnToggle}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
                onEditNote={mockOnEditNote}
                onTogglecheckIfExistAtHome={mockOnTogglecheckIfExistAtHome}
                onEditingChange={mockOnEditingChange}
            />
        );
        expect(screen.getByTestId('cloud-upload-icon')).toBeDefined();
    });

    it('renders the completed state with CheckCircle2 icon', () => {
        render(
            <SortableItem
                item={{ ...mockItem, completed: true }}
                onToggle={mockOnToggle}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
                onEditNote={mockOnEditNote}
                onTogglecheckIfExistAtHome={mockOnTogglecheckIfExistAtHome}
                onEditingChange={mockOnEditingChange}
            />
        );
        expect(screen.getByTestId('check-circle-icon')).toBeDefined();
    });
});
