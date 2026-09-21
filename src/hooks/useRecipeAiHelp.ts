import { useCallback, useEffect, useRef, useState } from 'react';
import { Meal, RecipeAiMessage, AIModelOption } from '../types';
import {
    askAboutRecipe,
    getSuggestedAlternativeModel,
    setActiveModelId,
} from '../services/aiService';

export interface UseRecipeAiHelpResult {
    messages: RecipeAiMessage[];
    isLoading: boolean;
    error: string | null;
    suggestedModel: AIModelOption | null;
    askQuestion: (question: string) => Promise<RecipeAiMessage | null>;
    retry: () => Promise<RecipeAiMessage | null>;
    clearConversation: () => void;
    clearError: () => void;
    applySuggestedModel: (modelId?: string) => void;
}

export function useRecipeAiHelp(
    meal: Meal | null,
    isOpen: boolean
): UseRecipeAiHelpResult {
    const [messages, setMessages] = useState<RecipeAiMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestedModel, setSuggestedModel] = useState<AIModelOption | null>(null);
    const [lastQuestion, setLastQuestion] = useState<string | null>(null);
    const requestInFlightRef = useRef(false);

    const clearConversation = useCallback(() => {
        setMessages([]);
        setError(null);
        setSuggestedModel(null);
        setLastQuestion(null);
    }, []);

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

    useEffect(() => {
        if (!isOpen || !meal) {
            clearConversation();
        }
    }, [clearConversation, isOpen, meal?.id]);

    const askQuestion = useCallback(async (question: string): Promise<RecipeAiMessage | null> => {
        const normalizedQuestion = question.trim();
        if (!normalizedQuestion || !meal || requestInFlightRef.current) {
            return null;
        }

        requestInFlightRef.current = true;
        const userMessage: RecipeAiMessage = { role: 'user', content: normalizedQuestion };
        const conversation = [...messages, userMessage];
        setMessages(conversation);
        setLastQuestion(normalizedQuestion);
        setIsLoading(true);
        setError(null);
        setSuggestedModel(null);

        try {
            const answer = await askAboutRecipe(normalizedQuestion, meal, conversation);
            const assistantMessage: RecipeAiMessage = { role: 'assistant', content: answer.text };
            setMessages(currentMessages => [...currentMessages, assistantMessage]);
            return assistantMessage;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Kunde inte fråga AI om receptet.';
            setError(message);
            setSuggestedModel(getSuggestedAlternativeModel());
            return null;
        } finally {
            requestInFlightRef.current = false;
            setIsLoading(false);
        }
    }, [meal, messages]);

    const retry = useCallback(async (): Promise<RecipeAiMessage | null> => {
        if (!lastQuestion || requestInFlightRef.current || !meal) {
            return null;
        }

        requestInFlightRef.current = true;
        setIsLoading(true);
        setError(null);
        setSuggestedModel(null);

        try {
            const answer = await askAboutRecipe(lastQuestion, meal, messages);
            const assistantMessage: RecipeAiMessage = { role: 'assistant', content: answer.text };
            setMessages(currentMessages => [...currentMessages, assistantMessage]);
            return assistantMessage;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Kunde inte fråga AI om receptet.';
            setError(message);
            setSuggestedModel(getSuggestedAlternativeModel());
            return null;
        } finally {
            requestInFlightRef.current = false;
            setIsLoading(false);
        }
    }, [lastQuestion, meal, messages]);

    return {
        messages,
        isLoading,
        error,
        suggestedModel,
        askQuestion,
        retry,
        clearConversation,
        clearError,
        applySuggestedModel,
    };
}
