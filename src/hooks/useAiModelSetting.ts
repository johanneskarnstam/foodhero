import { useState, useEffect, useCallback } from 'react';
import { AIModelOption, DEFAULT_GEMINI_MODELS } from '../types';
import {
    AI_MODEL_STORAGE_KEY,
    getActiveModelId,
    fetchAvailableGeminiModels,
} from '../services/aiService';

export interface UseAiModelSettingReturn {
    selectedModelId: string;
    selectedModel: AIModelOption | undefined;
    setSelectedModelId: (id: string) => void;
    models: AIModelOption[];
    isLoading: boolean;
    isFetchingRemote: boolean;
    error: string | null;
    refreshModels: () => Promise<void>;
}

export function useAiModelSetting(): UseAiModelSettingReturn {
    const [selectedModelId, setSelectedModelIdState] = useState<string>(() => getActiveModelId());
    const [models, setModels] = useState<AIModelOption[]>(DEFAULT_GEMINI_MODELS);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFetchingRemote, setIsFetchingRemote] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const setSelectedModelId = useCallback((id: string) => {
        setSelectedModelIdState(id);
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(AI_MODEL_STORAGE_KEY, id);
            }
        } catch {
            // Ignorera fel vid otillgänglig localStorage
        }
    }, []);

    const loadModels = useCallback(async (forceRefresh = false) => {
        if (forceRefresh) {
            setIsFetchingRemote(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const fetched = await fetchAvailableGeminiModels(forceRefresh);
            setModels(fetched);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Kunde inte hämta modeller');
            setModels(DEFAULT_GEMINI_MODELS);
        } finally {
            setIsLoading(false);
            setIsFetchingRemote(false);
        }
    }, []);

    useEffect(() => {
        void loadModels(false);
    }, [loadModels]);

    const refreshModels = useCallback(async () => {
        await loadModels(true);
    }, [loadModels]);

    const selectedModel = models.find(m => m.id === selectedModelId) ?? {
        id: selectedModelId,
        name: selectedModelId,
        description: '',
    };

    return {
        selectedModelId,
        selectedModel,
        setSelectedModelId,
        models,
        isLoading,
        isFetchingRemote,
        error,
        refreshModels,
    };
}
