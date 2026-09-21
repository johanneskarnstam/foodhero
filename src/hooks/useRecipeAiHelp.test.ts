import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Meal } from '../types';
import { useRecipeAiHelp } from './useRecipeAiHelp';

vi.mock('../services/aiService', () => ({
    askAboutRecipe: vi.fn(),
    getSuggestedAlternativeModel: vi.fn(() => ({
        id: 'gemini-3.6-flash',
        name: 'Gemini 3.6 Flash',
        performanceIndex: 9.4,
    })),
    setActiveModelId: vi.fn(),
}));

import * as aiService from '../services/aiService';

const meal: Meal = {
    id: 'meal-1',
    name: 'Laxpasta',
    createdAt: '',
    ingredients: [{ text: 'Lax', amount: '400 g' }],
    instructions: ['Koka pastan.'],
};

describe('useRecipeAiHelp', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('har tom konversation och inget loading-läge initialt', () => {
        const { result } = renderHook(() => useRecipeAiHelp(meal, true));

        expect(result.current.messages).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('lägger till fråga och AI-svar i rätt ordning', async () => {
        vi.mocked(aiService.askAboutRecipe).mockResolvedValueOnce({
            text: 'Du kan använda tofu i stället.',
        });
        const { result } = renderHook(() => useRecipeAiHelp(meal, true));

        await act(async () => {
            await result.current.askQuestion('  Vad kan jag använda i stället?  ');
        });

        expect(result.current.messages).toEqual([
            { role: 'user', content: 'Vad kan jag använda i stället?' },
            { role: 'assistant', content: 'Du kan använda tofu i stället.' },
        ]);
        expect(aiService.askAboutRecipe).toHaveBeenCalledWith(
            'Vad kan jag använda i stället?',
            meal,
            [{ role: 'user', content: 'Vad kan jag använda i stället?' }]
        );
    });

    it('ignorerar tom fråga och dubbla samtidiga anrop', async () => {
        let resolveAnswer!: (value: { text: string }) => void;
        vi.mocked(aiService.askAboutRecipe).mockReturnValueOnce(
            new Promise(resolve => {
                resolveAnswer = resolve;
            })
        );
        const { result } = renderHook(() => useRecipeAiHelp(meal, true));

        await act(async () => {
            await result.current.askQuestion('   ');
        });
        expect(aiService.askAboutRecipe).not.toHaveBeenCalled();

        act(() => {
            void result.current.askQuestion('Första frågan');
            void result.current.askQuestion('Andra frågan');
        });
        expect(aiService.askAboutRecipe).toHaveBeenCalledOnce();

        await act(async () => {
            resolveAnswer({ text: 'Svar' });
        });
    });

    it('sparar fel och föreslagen modell när anropet misslyckas', async () => {
        vi.mocked(aiService.askAboutRecipe).mockRejectedValueOnce(new Error('Nätverksfel'));
        const { result } = renderHook(() => useRecipeAiHelp(meal, true));

        await act(async () => {
            await result.current.askQuestion('Fungerar detta utan mjölk?');
        });

        expect(result.current.error).toBe('Nätverksfel');
        expect(result.current.suggestedModel?.id).toBe('gemini-3.6-flash');
        expect(result.current.messages).toEqual([
            { role: 'user', content: 'Fungerar detta utan mjölk?' },
        ]);
    });

    it('kan försöka igen utan att lägga till samma användarfråga två gånger', async () => {
        vi.mocked(aiService.askAboutRecipe)
            .mockRejectedValueOnce(new Error('Tillfälligt fel'))
            .mockResolvedValueOnce({ text: 'Ja, använd havregrädde.' });
        const { result } = renderHook(() => useRecipeAiHelp(meal, true));

        await act(async () => {
            await result.current.askQuestion('Kan jag byta grädde?');
        });
        await act(async () => {
            await result.current.retry();
        });

        expect(result.current.messages).toEqual([
            { role: 'user', content: 'Kan jag byta grädde?' },
            { role: 'assistant', content: 'Ja, använd havregrädde.' },
        ]);
        expect(aiService.askAboutRecipe).toHaveBeenLastCalledWith(
            'Kan jag byta grädde?',
            meal,
            [{ role: 'user', content: 'Kan jag byta grädde?' }]
        );
    });

    it('rensar konversationen när hjälpen stängs eller receptet byts', async () => {
        vi.mocked(aiService.askAboutRecipe).mockResolvedValueOnce({ text: 'Svar' });
        const { result, rerender } = renderHook(
            ({ currentMeal, open }) => useRecipeAiHelp(currentMeal, open),
            { initialProps: { currentMeal: meal, open: true } }
        );

        await act(async () => {
            await result.current.askQuestion('En fråga');
        });
        expect(result.current.messages).toHaveLength(2);

        rerender({ currentMeal: meal, open: false });
        expect(result.current.messages).toEqual([]);

        rerender({ currentMeal: { ...meal, id: 'meal-2' }, open: true });
        expect(result.current.messages).toEqual([]);
    });

    it('kan tillämpa föreslagen modell och rensa fel', async () => {
        vi.mocked(aiService.askAboutRecipe).mockRejectedValueOnce(new Error('Modellfel'));
        const { result } = renderHook(() => useRecipeAiHelp(meal, true));

        await act(async () => {
            await result.current.askQuestion('En fråga');
        });
        act(() => {
            result.current.applySuggestedModel();
        });

        expect(aiService.setActiveModelId).toHaveBeenCalledWith('gemini-3.6-flash');
        expect(result.current.error).toBeNull();
        expect(result.current.suggestedModel).toBeNull();
    });
});
