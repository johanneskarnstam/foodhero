import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecipeImageSearchModal } from './RecipeImageSearchModal';

const { mockFetchRecipeImageWithFallback } = vi.hoisted(() => ({
    mockFetchRecipeImageWithFallback: vi.fn(),
}));

vi.mock('../services/imageService', () => ({
    fetchRecipeImageWithFallback: mockFetchRecipeImageWithFallback,
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback || key,
    }),
}));

describe('RecipeImageSearchModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('söker automatiskt och visar hittad bild', async () => {
        mockFetchRecipeImageWithFallback.mockResolvedValueOnce('https://example.com/pasta.jpg');

        render(
            <RecipeImageSearchModal
                isOpen={true}
                onClose={vi.fn()}
                onSelectImage={vi.fn()}
                recipeName="Laxpasta"
            />
        );

        await waitFor(() => {
            expect(screen.getByRole('img', { name: 'Laxpasta' })).toHaveAttribute('src', 'https://example.com/pasta.jpg');
        });
    });

    it('returnerar vald bild och stänger modalen', async () => {
        const onClose = vi.fn();
        const onSelectImage = vi.fn();
        mockFetchRecipeImageWithFallback.mockResolvedValueOnce('https://example.com/pasta.jpg');

        render(
            <RecipeImageSearchModal
                isOpen={true}
                onClose={onClose}
                onSelectImage={onSelectImage}
                recipeName="Laxpasta"
            />
        );

        await screen.findByRole('img', { name: 'Laxpasta' });
        fireEvent.click(screen.getByRole('button', { name: 'Välj' }));

        expect(onSelectImage).toHaveBeenCalledWith('https://example.com/pasta.jpg');
        expect(onClose).toHaveBeenCalledOnce();
    });
});
