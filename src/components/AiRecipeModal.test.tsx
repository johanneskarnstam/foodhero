import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiRecipeModal } from './AiRecipeModal';

// Mockar useAiRecipe-hooken
const mockGenerateRecipe = vi.fn();
const mockClearError = vi.fn();
const mockApplySuggestedModel = vi.fn();

vi.mock('../hooks/useAiRecipe', () => ({
    useAiRecipe: () => ({
        isLoading: false,
        error: null,
        suggestedModel: null,
        generateRecipe: mockGenerateRecipe,
        enrichMeal: vi.fn(),
        clearError: mockClearError,
        applySuggestedModel: mockApplySuggestedModel,
        ...mockHookOverrides,
    }),
}));

// Dynamiska overrides för att simulera olika hook-tillstånd per test
let mockHookOverrides: Record<string, unknown> = {};

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, optionsOrFallback?: string | Record<string, unknown>) => {
            const translations: Record<string, string> = {
                'common.savingShort': '...',
            };
            if (translations[key]) return translations[key];
            if (typeof optionsOrFallback === 'string') return optionsOrFallback;
            if (optionsOrFallback && typeof optionsOrFallback === 'object') {
                if ('defaultValue' in optionsOrFallback && typeof optionsOrFallback.defaultValue === 'string') {
                    return optionsOrFallback.defaultValue;
                }
                if ('model' in optionsOrFallback) {
                    return `${key} ${optionsOrFallback.model}`;
                }
            }
            return key;
        },
    }),
}));

function makeRecipe(overrides = {}) {
    return {
        name: 'Laxpasta',
        description: 'En god krämig pasta.',
        servings: 4,
        tags: ['Fisk', 'Snabbt'],
        ingredients: [
            { text: 'Lax', amount: '400g' },
            { text: 'Grädde', amount: '2 dl' },
        ],
        instructions: ['Koka pasta.', 'Stek lax.', 'Blanda ihop.'],
        ...overrides,
    };
}

function renderModal(props: Partial<React.ComponentProps<typeof AiRecipeModal>> = {}) {
    const defaults = {
        isOpen: true,
        onClose: vi.fn(),
        onSave: vi.fn().mockResolvedValue(undefined),
    };
    return render(<AiRecipeModal {...defaults} {...props} />);
}

describe('AiRecipeModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHookOverrides = {};
        mockGenerateRecipe.mockResolvedValue(null);
    });

    // ─── Rendering ──────────────────────────────────────────────────────────────

    it('renderas inte när isOpen är false', () => {
        renderModal({ isOpen: false });
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renderas korrekt när isOpen är true', () => {
        renderModal();
        expect(screen.getByRole('dialog')).toBeDefined();
        expect(screen.getByLabelText('ai.recipePromptLabel')).toBeDefined();
    });

    it('visar promptfält och genereringsknapp', () => {
        renderModal();
        expect(screen.getByPlaceholderText('ai.recipePromptPlaceholder')).toBeDefined();
        expect(screen.getByRole('button', { name: /ai\.generate/ })).toBeDefined();
    });

    it('genereringsknappen är inaktiverad när prompten är tom', () => {
        renderModal();
        const generateBtn = screen.getByRole('button', { name: /ai\.generate/ });
        expect((generateBtn as HTMLButtonElement).disabled).toBe(true);
    });

    // ─── Stäng-knapp ────────────────────────────────────────────────────────────

    it('anropar onClose när stäng-knappen klickas', () => {
        const onClose = vi.fn();
        renderModal({ onClose });
        fireEvent.click(screen.getByLabelText('Stäng'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('anropar onClose när avbryt-knappen klickas', () => {
        const onClose = vi.fn();
        renderModal({ onClose });
        fireEvent.click(screen.getByRole('button', { name: /Avbryt/i }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    // ─── Generering ─────────────────────────────────────────────────────────────

    it('aktiverar genereringsknappen när prompt har innehåll', () => {
        renderModal();
        const input = screen.getByPlaceholderText('ai.recipePromptPlaceholder');
        fireEvent.change(input, { target: { value: 'laxpasta' } });
        const generateBtn = screen.getByRole('button', { name: /ai\.generate/ });
        expect((generateBtn as HTMLButtonElement).disabled).toBe(false);
    });

    it('anropar generateRecipe med korrekt prompt vid formulärinlämning', async () => {
        mockGenerateRecipe.mockResolvedValueOnce(makeRecipe());
        renderModal();

        const input = screen.getByPlaceholderText('ai.recipePromptPlaceholder');
        fireEvent.change(input, { target: { value: 'laxpasta för 4 personer' } });
        fireEvent.click(screen.getByRole('button', { name: /ai\.generate/ }));

        await waitFor(() => {
            expect(mockGenerateRecipe).toHaveBeenCalledWith('laxpasta för 4 personer');
        });
    });

    // ─── Förhandsvisning ────────────────────────────────────────────────────────

    it('visar receptets förhandsvisning efter lyckad generering', async () => {
        mockGenerateRecipe.mockResolvedValueOnce(makeRecipe());
        renderModal();

        const input = screen.getByPlaceholderText('ai.recipePromptPlaceholder');
        fireEvent.change(input, { target: { value: 'laxpasta' } });
        fireEvent.click(screen.getByRole('button', { name: /ai\.generate/ }));

        await waitFor(() => {
            expect(screen.getByText('Laxpasta')).toBeDefined();
        });

        expect(screen.getByText('En god krämig pasta.')).toBeDefined();
        expect(screen.getByText('Lax')).toBeDefined();
        expect(screen.getByText('Koka pasta.')).toBeDefined();
    });

    it('visar taggar i förhandsvisningen', async () => {
        mockGenerateRecipe.mockResolvedValueOnce(makeRecipe());
        renderModal();

        fireEvent.change(screen.getByPlaceholderText('ai.recipePromptPlaceholder'), {
            target: { value: 'laxpasta' },
        });
        fireEvent.click(screen.getByRole('button', { name: /ai\.generate/ }));

        await waitFor(() => {
            expect(screen.getByText('Fisk')).toBeDefined();
            expect(screen.getByText('Snabbt')).toBeDefined();
        });
    });

    it('visar bild och knapp för att byta bild i förhandsvisningen', async () => {
        mockGenerateRecipe.mockResolvedValueOnce(makeRecipe({ imageUrl: 'https://example.com/laxpasta.jpg' }));
        renderModal();

        fireEvent.change(screen.getByPlaceholderText('ai.recipePromptPlaceholder'), {
            target: { value: 'laxpasta' },
        });
        fireEvent.click(screen.getByRole('button', { name: /ai\.generate/ }));

        await waitFor(() => {
            expect(screen.getByRole('img', { name: 'Laxpasta' })).toHaveAttribute('src', 'https://example.com/laxpasta.jpg');
        });
        expect(screen.getByRole('button', { name: 'ai.changeImage' })).toBeInTheDocument();
    });

    it('visar spara- och generera-om-knappar efter lyckad generering', async () => {
        mockGenerateRecipe.mockResolvedValueOnce(makeRecipe());
        renderModal();

        fireEvent.change(screen.getByPlaceholderText('ai.recipePromptPlaceholder'), {
            target: { value: 'laxpasta' },
        });
        fireEvent.click(screen.getByRole('button', { name: /ai\.generate/ }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /ai\.saveRecipe/i })).toBeDefined();
            expect(screen.getByRole('button', { name: /ai\.regenerate/i })).toBeDefined();
        });
    });

    // ─── Felvisning ─────────────────────────────────────────────────────────────

    it('visar felmeddelande från hooken', async () => {
        mockHookOverrides = { error: 'Nätverksfel: Kunde inte ansluta' };
        renderModal();
        expect(screen.getByRole('alert')).toBeDefined();
        expect(screen.getByText('Nätverksfel: Kunde inte ansluta')).toBeDefined();
    });

    // ─── Spara ──────────────────────────────────────────────────────────────────

    it('anropar onSave med korrekt data och stänger modalen', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        const onClose = vi.fn();
        mockGenerateRecipe.mockResolvedValueOnce(makeRecipe());
        renderModal({ onSave, onClose });

        fireEvent.change(screen.getByPlaceholderText('ai.recipePromptPlaceholder'), {
            target: { value: 'laxpasta' },
        });
        fireEvent.click(screen.getByRole('button', { name: /ai\.generate/ }));

        await waitFor(() => screen.getByRole('button', { name: /ai\.saveRecipe/i }));
        fireEvent.click(screen.getByRole('button', { name: /ai\.saveRecipe/i }));

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledOnce();
            const savedData = onSave.mock.calls[0][0];
            expect(savedData.name).toBe('Laxpasta');
            expect(savedData.ingredients).toHaveLength(2);
            expect(savedData.instructions).toHaveLength(3);
        });

        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    });

    // ─── Rensa state vid återöppning ────────────────────────────────────────────

    it('återställer state när modalen öppnas igen', async () => {
        mockGenerateRecipe.mockResolvedValueOnce(makeRecipe());
        const { rerender } = renderModal();

        fireEvent.change(screen.getByPlaceholderText('ai.recipePromptPlaceholder'), {
            target: { value: 'laxpasta' },
        });
        fireEvent.click(screen.getByRole('button', { name: /ai\.generate/ }));
        await waitFor(() => screen.getByText('Laxpasta'));

        // Stäng och öppna igen
        rerender(
            <AiRecipeModal isOpen={false} onClose={vi.fn()} onSave={vi.fn().mockResolvedValue(undefined)} />
        );
        rerender(
            <AiRecipeModal isOpen={true} onClose={vi.fn()} onSave={vi.fn().mockResolvedValue(undefined)} />
        );

        expect(screen.queryByText('Laxpasta')).toBeNull();
        expect((screen.getByPlaceholderText('ai.recipePromptPlaceholder') as HTMLInputElement).value).toBe('');
    });

    // ─── Modellförslag vid fel ──────────────────────────────────────────────────

    it('visar förslag på alternativ modell vid fel om suggestedModel finns och tillåter snabb-byte', async () => {
        mockHookOverrides = {
            error: 'AI-modellen svarar inte.',
            suggestedModel: {
                id: 'gemini-3.6-flash',
                name: 'Gemini 3.6 Flash',
                performanceIndex: 9.4,
            },
        };

        renderModal();

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('AI-modellen svarar inte.')).toBeInTheDocument();

        const applyBtn = screen.getByRole('button', { name: /ai\.useSuggestedModel/ });
        expect(applyBtn).toBeInTheDocument();

        // Klicka på knappen för att byta till föreslagen modell
        fireEvent.click(applyBtn);
        expect(mockApplySuggestedModel).toHaveBeenCalledWith('gemini-3.6-flash');
    });
});
