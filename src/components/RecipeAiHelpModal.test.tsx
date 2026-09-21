import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Meal, RecipeAiMessage } from '../types';
import { RecipeAiHelpModal } from './RecipeAiHelpModal';

const mockAskQuestion = vi.fn();
const mockRetry = vi.fn();
const mockClearError = vi.fn();
const mockApplySuggestedModel = vi.fn();
let mockHookState: {
    messages: RecipeAiMessage[];
    isLoading: boolean;
    error: string | null;
    suggestedModel: { id: string; name: string } | null;
} = {
    messages: [],
    isLoading: false,
    error: null,
    suggestedModel: null,
};

vi.mock('../hooks/useRecipeAiHelp', () => ({
    useRecipeAiHelp: () => ({
        ...mockHookState,
        askQuestion: mockAskQuestion,
        retry: mockRetry,
        clearConversation: vi.fn(),
        clearError: mockClearError,
        applySuggestedModel: mockApplySuggestedModel,
    }),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: string | Record<string, unknown>) => {
            const translations: Record<string, string> = {
                'recipeAiHelp.title': 'Fråga AI om receptet',
                'recipeAiHelp.intro': 'Fråga om ingredienser, tillagningssteg eller möjliga ersättare.',
                'recipeAiHelp.quickQuestionsLabel': 'Vanliga frågor',
                'recipeAiHelp.quickQuestionSubstitute': 'Vad kan jag använda i stället?',
                'recipeAiHelp.quickQuestionMissing': 'Vad gör jag om jag saknar en ingrediens?',
                'recipeAiHelp.quickQuestionSteps': 'Kan du förklara tillagningsstegen?',
                'recipeAiHelp.questionLabel': 'Din fråga',
                'recipeAiHelp.placeholder': 'T.ex. Jag saknar grädde, vad kan jag använda?',
                'recipeAiHelp.send': 'Skicka fråga',
                'recipeAiHelp.loading': 'AI funderar...',
                'recipeAiHelp.retry': 'Försök igen',
                'recipeAiHelp.disclaimer': 'AI-svar kan vara felaktiga.',
                'common.close': 'Stäng',
                'ai.useSuggestedModel': 'Byt till {{model}} och försök igen',
            };
            const value = translations[key] ?? key;
            if (typeof options === 'object' && options?.model) {
                return value.replace('{{model}}', String(options.model));
            }
            return typeof options === 'string' ? options : value;
        },
    }),
}));

const meal: Meal = {
    id: 'meal-1',
    name: 'Laxpasta',
    createdAt: '',
    ingredients: [{ text: 'Lax', amount: '400 g' }],
    instructions: ['Koka pastan.'],
};

function renderModal(props: Partial<React.ComponentProps<typeof RecipeAiHelpModal>> = {}) {
    return render(
        <RecipeAiHelpModal
            isOpen={true}
            onClose={vi.fn()}
            meal={meal}
            {...props}
        />
    );
}

describe('RecipeAiHelpModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHookState = {
            messages: [],
            isLoading: false,
            error: null,
            suggestedModel: null,
        };
    });

    it('renderas inte när den är stängd eller saknar recept', () => {
        const { rerender } = renderModal({ isOpen: false });
        expect(screen.queryByRole('dialog')).toBeNull();

        rerender(<RecipeAiHelpModal isOpen={true} onClose={vi.fn()} meal={null} />);
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('visar receptnamn, snabbfrågor och frågefält', () => {
        renderModal();

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Laxpasta')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('T.ex. Jag saknar grädde, vad kan jag använda?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Vad kan jag använda i stället?' })).toBeInTheDocument();
    });

    it('skickar en snabbfråga direkt', async () => {
        renderModal();

        fireEvent.click(screen.getByRole('button', { name: 'Vad kan jag använda i stället?' }));

        await waitFor(() => {
            expect(mockAskQuestion).toHaveBeenCalledWith('Vad kan jag använda i stället?');
        });
    });

    it('skickar textfråga via formuläret och tömmer fältet', async () => {
        renderModal();
        const input = screen.getByPlaceholderText('T.ex. Jag saknar grädde, vad kan jag använda?');

        fireEvent.change(input, { target: { value: '  Kan jag byta grädde?  ' } });
        fireEvent.click(screen.getByRole('button', { name: 'Skicka fråga' }));

        await waitFor(() => {
            expect(mockAskQuestion).toHaveBeenCalledWith('Kan jag byta grädde?');
        });
        expect(input).toHaveValue('');
    });

    it('skickar med Enter men inte Shift+Enter', async () => {
        renderModal();
        const input = screen.getByPlaceholderText('T.ex. Jag saknar grädde, vad kan jag använda?');
        fireEvent.change(input, { target: { value: 'En fråga' } });

        fireEvent.keyDown(input, { key: 'Shift', shiftKey: true });
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
        expect(mockAskQuestion).not.toHaveBeenCalled();

        fireEvent.keyDown(input, { key: 'Enter' });
        await waitFor(() => expect(mockAskQuestion).toHaveBeenCalledWith('En fråga'));
    });

    it('visar meddelanden, loading och fel med retry', () => {
        mockHookState = {
            messages: [
                { role: 'user', content: 'Vad kan jag använda?' },
                { role: 'assistant', content: 'Prova crème fraîche.' },
            ],
            isLoading: true,
            error: 'Tillfälligt fel',
            suggestedModel: { id: 'gemini-test', name: 'Gemini Test' },
        };
        renderModal();

        expect(screen.getByText('Vad kan jag använda?')).toBeInTheDocument();
        expect(screen.getByText('Prova crème fraîche.')).toBeInTheDocument();
        expect(screen.getByText('AI funderar...')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('Tillfälligt fel');
        expect(screen.getByRole('button', { name: 'Försök igen' })).toBeDisabled();
        expect(screen.getByText('Byt till Gemini Test och försök igen')).toBeInTheDocument();
    });

    it('stänger med stängknappen och Escape', () => {
        const onClose = vi.fn();
        renderModal({ onClose });

        fireEvent.click(screen.getByRole('button', { name: 'Stäng' }));
        expect(onClose).toHaveBeenCalledOnce();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('fokuserar stängknappen vid öppning och återför fokus vid stängning', () => {
        const trigger = document.createElement('button');
        document.body.appendChild(trigger);
        trigger.focus();

        const { rerender } = renderModal();

        expect(screen.getByRole('button', { name: 'Stäng' })).toHaveFocus();

        rerender(
            <RecipeAiHelpModal
                isOpen={false}
                onClose={vi.fn()}
                meal={meal}
            />
        );

        expect(trigger).toHaveFocus();
        trigger.remove();
    });
});
