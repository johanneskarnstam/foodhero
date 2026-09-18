import { useState, useCallback } from 'react';
import { Meal, AIModelOption } from '../types';
import {
    generateRecipe,
    enrichMeal as enrichMealService,
    GeneratedRecipe,
    getSuggestedAlternativeModel,
    setActiveModelId,
} from '../services/aiService';

export interface UseAiRecipeResult {
    isLoading: boolean;
    error: string | null;
    suggestedModel: AIModelOption | null;
    generateRecipe: (prompt: string) => Promise<GeneratedRecipe | null>;
    enrichMeal: (meal: Partial<Meal>) => Promise<GeneratedRecipe | null>;
    clearError: () => void;
    applySuggestedModel: (modelId?: string) => void;
}

/**
 * Hook för att generera och berika recept via Gemini AI.
 *
 * Exponerar två operationer:
 * - generateRecipe: genererar ett nytt komplett recept från en fri textprompt.
 * - enrichMeal: berikar en befintlig måltid som saknar ingredienser/instruktioner.
 *
 * Hanterar loading-state, användarvänliga felmeddelanden och förslag på
 * alternativa AI-modeller om anropet misslyckas.
 */
export function useAiRecipe(): UseAiRecipeResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestedModel, setSuggestedModel] = useState<AIModelOption | null>(null);

    const clearError = useCallback(() => {
        setError(null);
        setSuggestedModel(null);
    }, []);

    const applySuggestedModel = useCallback((modelId?: string) => {
        const targetId = modelId || suggestedModel?.id;
        if (targetId) {
            setActiveModelId(targetId);
            setSuggestedModel(null);
            setError(null);
        }
    }, [suggestedModel]);

    const handleGenerateRecipe = useCallback(async (prompt: string): Promise<GeneratedRecipe | null> => {
        setIsLoading(true);
        setError(null);
        setSuggestedModel(null);
        try {
            const result = await generateRecipe(prompt);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Kunde inte generera recept.';
            setError(message);
            setSuggestedModel(getSuggestedAlternativeModel());
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleEnrichMeal = useCallback(async (meal: Partial<Meal>): Promise<GeneratedRecipe | null> => {
        setIsLoading(true);
        setError(null);
        setSuggestedModel(null);
        try {
            const result = await enrichMealService(meal);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Kunde inte berika recept.';
            setError(message);
            setSuggestedModel(getSuggestedAlternativeModel());
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        suggestedModel,
        generateRecipe: handleGenerateRecipe,
        enrichMeal: handleEnrichMeal,
        clearError,
        applySuggestedModel,
    };
}
