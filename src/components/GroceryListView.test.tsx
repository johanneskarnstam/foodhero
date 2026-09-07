 import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { GroceryListView } from './GroceryListView';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-router-dom navigate and outlet context
const mockNavigate = vi.fn();
const mockOutletContext = { isMoreOpen: false };

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useOutletContext: () => mockOutletContext
    };
});

// Mock the hooks
vi.mock('../context/AppContext');
vi.mock('../context/ToastContext');
vi.mock('../hooks/useVoiceInput');
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}));

describe('GroceryListView Voice Input', () => {
    const mockUpdateListItems = vi.fn();
    const mockUpdateListAccess = vi.fn();
    let mockTranscript = '';

    beforeEach(() => {
        mockTranscript = '';
        vi.mocked(useVoiceInput).mockImplementation(() => ({
            isListening: true,
            transcript: mockTranscript,
            startListening: vi.fn(),
            stopListening: vi.fn(),
            resetTranscript: vi.fn(),
            hasSupport: true,
        }));

        vi.clearAllMocks();
        
        vi.mocked(useApp).mockReturnValue({
            lists: [{ id: '1', items: [], settings: {}, isPending: false }],
            defaultListId: '1',
            updateListItems: mockUpdateListItems,
            updateListAccess: mockUpdateListAccess,
            loading: false,
            itemHistory: [],
            addToHistory: vi.fn(),
            categories: [],
            addCategory: vi.fn(),
            mealPlans: [],
        } as unknown as ReturnType<typeof useApp>);

        vi.mocked(useToast).mockReturnValue({
            showToast: vi.fn(),
        } as unknown as ReturnType<typeof useToast>);
    });

    it('renders the microphone button when voice input is supported', () => {
        vi.mocked(useVoiceInput).mockReturnValue({
            isListening: false,
            transcript: '',
            startListening: vi.fn(),
            stopListening: vi.fn(),
            resetTranscript: vi.fn(),
            hasSupport: true,
        });

        render(<MemoryRouter><GroceryListView /></MemoryRouter>);
        
        expect(screen.getByTitle('Voice Input')).toBeInTheDocument();
    });

    it('does not render the microphone button when voice input is not supported', () => {
        vi.mocked(useVoiceInput).mockReturnValue({
            isListening: false,
            transcript: '',
            startListening: vi.fn(),
            stopListening: vi.fn(),
            resetTranscript: vi.fn(),
            hasSupport: false,
        });

        render(<MemoryRouter><GroceryListView /></MemoryRouter>);
        
        expect(screen.queryByTitle('Voice Input')).not.toBeInTheDocument();
    });

    it('calls startListening when the microphone button is clicked and not listening', () => {
        const startListening = vi.fn();
        vi.mocked(useVoiceInput).mockReturnValue({
            isListening: false,
            transcript: '',
            startListening,
            stopListening: vi.fn(),
            resetTranscript: vi.fn(),
            hasSupport: true,
        });

        render(<MemoryRouter><GroceryListView /></MemoryRouter>);
        
        const micButton = screen.getByTitle('Voice Input');
        fireEvent.click(micButton);
        
        expect(startListening).toHaveBeenCalledTimes(1);
    });

    it('calls stopListening when the microphone button is clicked and listening', () => {
        const stopListening = vi.fn();
        vi.mocked(useVoiceInput).mockReturnValue({
            isListening: true,
            transcript: '',
            startListening: vi.fn(),
            stopListening,
            resetTranscript: vi.fn(),
            hasSupport: true,
        });

        render(<MemoryRouter><GroceryListView /></MemoryRouter>);
        
        const micButton = screen.getByTitle('Stop Listening');
        fireEvent.click(micButton);
        
        expect(stopListening).toHaveBeenCalledTimes(1);
    });

    it('updates the input field when the transcript changes', async () => {
        const { rerender } = render(<MemoryRouter><GroceryListView /></MemoryRouter>);
        
        const input = screen.getByPlaceholderText('lists.addItemPlaceholder');
        expect(input).toHaveValue('');
        
        // Update the variable that the mock implementation uses
        mockTranscript = 'Milk';

        await act(async () => {
            rerender(<MemoryRouter><GroceryListView key="updated" /></MemoryRouter>);
        });
        
        await waitFor(() => {
            const updatedInput = screen.getByPlaceholderText('lists.addItemPlaceholder');
            expect(updatedInput).toHaveValue('Milk');
        }, { timeout: 2000 });
    });

    it('hides the floating add item bar when editing an existing item in the list', () => {
        vi.mocked(useVoiceInput).mockReturnValue({
            isListening: false,
            transcript: '',
            startListening: vi.fn(),
            stopListening: vi.fn(),
            resetTranscript: vi.fn(),
            hasSupport: true,
        });

        vi.mocked(useApp).mockReturnValue({
            lists: [{
                id: '1',
                items: [{ id: 'item-1', text: 'Mjölk', completed: false, createdAt: '' }],
                settings: {},
                isPending: false
            }],
            defaultListId: '1',
            updateListItems: vi.fn(),
            updateListAccess: vi.fn(),
            loading: false,
            itemHistory: [],
            addToHistory: vi.fn(),
            categories: [],
            addCategory: vi.fn(),
            mealPlans: [],
        } as unknown as ReturnType<typeof useApp>);

        render(<MemoryRouter><GroceryListView /></MemoryRouter>);

        // Initially, the add-item input is visible
        const addItemInput = screen.getByPlaceholderText('lists.addItemPlaceholder');
        expect(addItemInput).toBeInTheDocument();

        // Focus the existing item text input
        const itemInput = screen.getByDisplayValue('Mjölk');
        fireEvent.focus(itemInput);

        // The floating add-item bar should now be hidden
        expect(screen.queryByPlaceholderText('lists.addItemPlaceholder')).not.toBeInTheDocument();

        // Blur the item input
        fireEvent.blur(itemInput);

        // The floating add-item bar should reappear
        expect(screen.getByPlaceholderText('lists.addItemPlaceholder')).toBeInTheDocument();
    });
});