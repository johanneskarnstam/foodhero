import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAiRecipe } from './useAiRecipe';

// Mockar aiService så att testerna inte gör riktiga API-anrop
vi.mock('../services/aiService', () => ({
    generateRecipe: vi.fn(),
    enrichMeal: vi.fn(),
}));

import * as aiService from '../services/aiService';

// Hjälpfunktion för ett giltigt GeneratedRecipe-svar
function makeRecipe(overrides = {}) {
    return {
        name: 'Laxpasta',
        description: 'En god pasta med lax.',
        servings: 4,
        tags: ['Fisk', 'Snabbt'],
        ingredients: [{ text: 'Lax', amount: '400g' }],
        instructions: ['Koka pasta.', 'Stek lax.'],
        ...overrides,
    };
}

describe('useAiRecipe', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── Initialtillstånd ───────────────────────────────────────────────────────

    it('har korrekt initialtillstånd', () => {
        const { result } = renderHook(() => useAiRecipe());

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    // ─── generateRecipe ─────────────────────────────────────────────────────────

    it('sätter isLoading=true under anrop och false efteråt', async () => {
        let resolvePromise!: (value: ReturnType<typeof makeRecipe>) => void;
        const pendingPromise = new Promise<ReturnType<typeof makeRecipe>>(res => {
            resolvePromise = res;
        });
        vi.mocked(aiService.generateRecipe).mockReturnValueOnce(pendingPromise);

        const { result } = renderHook(() => useAiRecipe());

        let callPromise!: Promise<ReturnType<typeof makeRecipe> | null>;
        act(() => {
            callPromise = result.current.generateRecipe('laxpasta');
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolvePromise(makeRecipe());
            await callPromise;
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('returnerar GeneratedRecipe vid lyckat anrop', async () => {
        const recipe = makeRecipe();
        vi.mocked(aiService.generateRecipe).mockResolvedValueOnce(recipe);

        const { result } = renderHook(() => useAiRecipe());

        let returnValue: ReturnType<typeof makeRecipe> | null = null;
        await act(async () => {
            returnValue = await result.current.generateRecipe('laxpasta');
        });

        expect(returnValue).toEqual(recipe);
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('returnerar null och sätter error vid misslyckat anrop', async () => {
        vi.mocked(aiService.generateRecipe).mockRejectedValueOnce(
            new Error('Nätverksfel: Kunde inte ansluta')
        );

        const { result } = renderHook(() => useAiRecipe());

        let returnValue: ReturnType<typeof makeRecipe> | null = undefined as unknown as null;
        await act(async () => {
            returnValue = await result.current.generateRecipe('test');
        });

        expect(returnValue).toBeNull();
        expect(result.current.error).toBe('Nätverksfel: Kunde inte ansluta');
        expect(result.current.isLoading).toBe(false);
    });

    it('sätter ett generiskt felmeddelande för icke-Error-undantag', async () => {
        vi.mocked(aiService.generateRecipe).mockRejectedValueOnce('oväntat fel');

        const { result } = renderHook(() => useAiRecipe());

        await act(async () => {
            await result.current.generateRecipe('test');
        });

        expect(result.current.error).toBe('Kunde inte generera recept.');
    });

    it('rensar tidigare error innan ett nytt anrop', async () => {
        vi.mocked(aiService.generateRecipe)
            .mockRejectedValueOnce(new Error('Första felet'))
            .mockResolvedValueOnce(makeRecipe());

        const { result } = renderHook(() => useAiRecipe());

        await act(async () => {
            await result.current.generateRecipe('test');
        });
        expect(result.current.error).toBe('Första felet');

        await act(async () => {
            await result.current.generateRecipe('test igen');
        });
        expect(result.current.error).toBeNull();
    });

    // ─── enrichMeal ─────────────────────────────────────────────────────────────

    it('returnerar GeneratedRecipe vid lyckat enrichMeal-anrop', async () => {
        const recipe = makeRecipe({ name: 'Köttbullar' });
        vi.mocked(aiService.enrichMeal).mockResolvedValueOnce(recipe);

        const { result } = renderHook(() => useAiRecipe());

        let returnValue: ReturnType<typeof makeRecipe> | null = null;
        await act(async () => {
            returnValue = await result.current.enrichMeal({ name: 'Köttbullar' });
        });

        expect(returnValue).toEqual(recipe);
        expect(result.current.error).toBeNull();
    });

    it('returnerar null och sätter error vid misslyckat enrichMeal-anrop', async () => {
        vi.mocked(aiService.enrichMeal).mockRejectedValueOnce(
            new Error('Ogiltig API-nyckel')
        );

        const { result } = renderHook(() => useAiRecipe());

        let returnValue: ReturnType<typeof makeRecipe> | null = undefined as unknown as null;
        await act(async () => {
            returnValue = await result.current.enrichMeal({ name: 'Test' });
        });

        expect(returnValue).toBeNull();
        expect(result.current.error).toBe('Ogiltig API-nyckel');
    });

    it('sätter isLoading korrekt under enrichMeal-anrop', async () => {
        vi.mocked(aiService.enrichMeal).mockResolvedValueOnce(makeRecipe());

        const { result } = renderHook(() => useAiRecipe());

        await act(async () => {
            await result.current.enrichMeal({ name: 'Pannkakor' });
        });

        expect(result.current.isLoading).toBe(false);
    });

    // ─── clearError ─────────────────────────────────────────────────────────────

    it('clearError nollställer felmeddelandet', async () => {
        vi.mocked(aiService.generateRecipe).mockRejectedValueOnce(new Error('Ett fel'));

        const { result } = renderHook(() => useAiRecipe());

        await act(async () => {
            await result.current.generateRecipe('test');
        });
        expect(result.current.error).toBe('Ett fel');

        act(() => {
            result.current.clearError();
        });
        expect(result.current.error).toBeNull();
    });
});
