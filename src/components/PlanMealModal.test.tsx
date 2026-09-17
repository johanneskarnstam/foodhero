import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanMealModal } from './PlanMealModal';
import { Meal } from '../types';

const mockMeal: Meal = {
    id: '1',
    name: 'Pasta Carbonara',
    description: 'Klassisk italiensk pasta',
    tags: ['pasta', 'italian'],
    ingredients: [],
    imageUrl: '',
    createdAt: ''
};

const mockOnClose = vi.fn();
const mockOnSave = vi.fn();

describe('PlanMealModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render when isOpen is true', () => {
        render(
            <PlanMealModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                meal={mockMeal}
            />
        );

        expect(screen.getByText(/Planera in måltid/i)).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
        const { container } = render(
            <PlanMealModal
                isOpen={false}
                onClose={mockOnClose}
                onSave={mockOnSave}
                meal={mockMeal}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should display meal name in description when meal is provided', () => {
        render(
            <PlanMealModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                meal={mockMeal}
            />
        );

        expect(screen.getByText('Planera in måltid')).toBeInTheDocument();
    });

    it('should display day and meal selection label', () => {
        render(
            <PlanMealModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                meal={mockMeal}
            />
        );

        expect(screen.getByText('Välj dag och måltid')).toBeInTheDocument();
    });

    it('should call onClose when cancel button is clicked', () => {
        render(
            <PlanMealModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                meal={mockMeal}
            />
        );

        const cancelButton = screen.getByText(/Avbryt/i);
        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable save button when no date is selected', () => {
        render(
            <PlanMealModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                meal={mockMeal}
            />
        );

        const saveButton = screen.getByText(/Spara/i);
        expect(saveButton).toBeDisabled();
    });
});
