import { useState, useCallback } from 'react';
import { Meal } from '../types';
import { generateRecipe, enrichMeal as enrichMealService, GeneratedRecipe } from '../services/aiService';

export interface UseAiRecipeResult {
    isLoading: boolean;
    error: string | null;
    generateRecipe: (prompt: string) => Promise<GeneratedRecipe | null>;
    enrichMeal: (meal: Partial<Meal>) => Promise<GeneratedRecipe | null>;
    clearError: () => void;
}

/**
 * Hook för att generera och berika recept via Gemini AI.
 *
 * Exponerar två operationer:
 * - generateRecipe: genererar ett nytt komplett recept från en fri textprompt.
 * - enrichMeal: berikar en befintlig måltid som saknar ingredienser/instruktioner.
 *
 * Hanterar loading-state och användarvänliga felmeddelanden internt.
 */
export function useAiRecipe(): UseAiRecipeResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleGenerateRecipe = useCallback(async (prompt: string): Promise<GeneratedRecipe | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateRecipe(prompt);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Kunde inte generera recept.';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleEnrichMeal = useCallback(async (meal: Partial<Meal>): Promise<GeneratedRecipe | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await enrichMealService(meal);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Kunde inte berika recept.';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        generateRecipe: handleGenerateRecipe,
        enrichMeal: handleEnrichMeal,
        clearError,
    };
}
