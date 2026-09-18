import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiModelSelector } from './AiModelSelector';
import { DEFAULT_GEMINI_MODELS } from '../types';

const mockSetSelectedModelId = vi.fn();
const mockRefreshModels = vi.fn();
const mockShowToast = vi.fn();

let mockHookOverrides = {};

vi.mock('../hooks/useAiModelSetting', () => ({
    useAiModelSetting: () => ({
        selectedModelId: 'gemini-2.5-flash',
        selectedModel: DEFAULT_GEMINI_MODELS[0],
        setSelectedModelId: mockSetSelectedModelId,
        models: DEFAULT_GEMINI_MODELS,
        isLoading: false,
        isFetchingRemote: false,
        error: null,
        refreshModels: mockRefreshModels,
        ...mockHookOverrides,
    }),
}));

vi.mock('../context/ToastContext', () => ({
    useToast: () => ({
        showToast: mockShowToast,
    }),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => {
            if (key === 'aiSettings.modelChanged') return `Bytte till ${options?.name}`;
            if (key === 'aiSettings.refreshSuccess') return `${options?.count} modeller hämtades`;
            if (key === 'aiSettings.title') return 'AI-modell';
            if (key === 'aiSettings.refreshButton') return 'Hämta senaste modeller';
            if (key === 'aiSettings.showMore') return `Visa alla modeller (${options?.count} st)`;
            if (key === 'aiSettings.showLess') return 'Visa färre modeller';
            return key;
        },
    }),
}));

describe('AiModelSelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHookOverrides = {};
    });

    it('renderar rubrik och alla standardmodeller', () => {
        render(<AiModelSelector />);

        expect(screen.getByText('AI-modell')).toBeInTheDocument();
        expect(screen.getByText('Gemini 2.5 Flash')).toBeInTheDocument();
        expect(screen.getByText('Gemini 3.8 Flash')).toBeInTheDocument();
    });

    it('anropar setSelectedModelId och visar toast när användaren väljer en annan modell', () => {
        render(<AiModelSelector />);

        const modelButton = screen.getByRole('radio', { name: /Gemini 3.8 Flash/i });
        fireEvent.click(modelButton);

        expect(mockSetSelectedModelId).toHaveBeenCalledWith('gemini-3.8-flash');
        expect(mockShowToast).toHaveBeenCalledWith('Bytte till Gemini 3.8 Flash', 'success');
    });

    it('anropar refreshModels och visar toast vid klick på uppdatera-knappen', async () => {
        mockRefreshModels.mockResolvedValueOnce(undefined);
        render(<AiModelSelector />);

        const refreshButton = screen.getByRole('button', { name: 'Hämta senaste modeller' });
        fireEvent.click(refreshButton);

        await waitFor(() => {
            expect(mockRefreshModels).toHaveBeenCalled();
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('modeller hämtades'),
                'success'
            );
        });
    });

    it('visar modellens badge och beskrivning av styrkor', () => {
        render(<AiModelSelector />);

        expect(screen.getByText('Toppval')).toBeInTheDocument();
        expect(screen.getByText(/Googles senaste flaggskepp|Senaste generationen/)).toBeInTheDocument();
    });

    it('visar "visa fler modeller"-knapp och expanderar listan vid fler än 5 modeller', () => {
        const manyModels = Array.from({ length: 8 }, (_, i) => ({
            id: `gemini-test-${i + 1}`,
            name: `Gemini Test ${i + 1}`,
            description: `Beskrivning för testmodell ${i + 1}`,
            badge: i === 0 ? 'Toppval' : undefined,
        }));

        mockHookOverrides = {
            models: manyModels,
            selectedModelId: 'gemini-test-1',
        };

        render(<AiModelSelector />);

        // De 5 första syns initialt
        expect(screen.getByText('Gemini Test 1')).toBeInTheDocument();
        expect(screen.getByText('Gemini Test 5')).toBeInTheDocument();
        expect(screen.queryByText('Gemini Test 6')).not.toBeInTheDocument();

        // Knappen "Visa alla modeller" finns
        const toggleButton = screen.getByRole('button', { name: /Visa alla modeller/i });
        expect(toggleButton).toBeInTheDocument();

        // Klicka för att expandera
        fireEvent.click(toggleButton);
        expect(screen.getByText('Gemini Test 6')).toBeInTheDocument();
        expect(screen.getByText('Gemini Test 8')).toBeInTheDocument();

        // Klicka igen för att minimera
        fireEvent.click(screen.getByRole('button', { name: /Visa färre modeller/i }));
        expect(screen.queryByText('Gemini Test 6')).not.toBeInTheDocument();
    });
});
