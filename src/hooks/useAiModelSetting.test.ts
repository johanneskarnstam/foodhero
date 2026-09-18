import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAiModelSetting } from './useAiModelSetting';
import * as aiService from '../services/aiService';
import { DEFAULT_GEMINI_MODELS } from '../types';

describe('useAiModelSetting', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('returnerar standardmodell om ingen är sparad i localStorage', () => {
        const { result } = renderHook(() => useAiModelSetting());
        expect(result.current.selectedModelId).toBe('gemini-2.5-flash');
        expect(result.current.selectedModel?.id).toBe('gemini-2.5-flash');
    });

    it('uppdaterar valt modell-id och sparar i localStorage vid setSelectedModelId', () => {
        const { result } = renderHook(() => useAiModelSetting());

        act(() => {
            result.current.setSelectedModelId('gemini-3.8-flash');
        });

        expect(result.current.selectedModelId).toBe('gemini-3.8-flash');
        expect(localStorage.getItem('foodhero_ai_model')).toBe('gemini-3.8-flash');
    });

    it('refreshModels anropar fetchAvailableGeminiModels med forceRefresh=true', async () => {
        const customModels = [
            { id: 'gemini-custom', name: 'Gemini Custom', description: 'Test', isOnline: true },
        ];
        vi.spyOn(aiService, 'fetchAvailableGeminiModels').mockResolvedValue(customModels);

        const { result } = renderHook(() => useAiModelSetting());

        await act(async () => {
            await result.current.refreshModels();
        });

        expect(aiService.fetchAvailableGeminiModels).toHaveBeenCalledWith(true);
        expect(result.current.models).toEqual(customModels);
    });

    it('hanterar fel under refreshModels och behåller eller sätter DEFAULT_GEMINI_MODELS', async () => {
        vi.spyOn(aiService, 'fetchAvailableGeminiModels').mockRejectedValue(new Error('API error'));

        const { result } = renderHook(() => useAiModelSetting());

        await act(async () => {
            await result.current.refreshModels();
        });

        expect(result.current.error).toBe('API error');
        expect(result.current.models).toEqual(DEFAULT_GEMINI_MODELS);
    });
});
