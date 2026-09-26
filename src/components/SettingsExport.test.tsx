import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsView } from './SettingsView';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWakeLock } from '../hooks/useWakeLock';
import * as timerUtils from '../utils/timerUtils';
import * as timerNotifications from '../utils/timerNotifications';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../context/AppContext');
vi.mock('../context/AuthContext');
vi.mock('../context/ToastContext');
vi.mock('../hooks/useWakeLock');
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { 
            language: 'en', 
            changeLanguage: vi.fn(),
            initReactI18next: vi.fn()
        }
    }),
    initReactI18next: {
        type: 'function',
        implement: vi.fn(),
    },
}));

describe('SettingsView Export & Import Functionality', () => {
    const mockShowToast = vi.fn();
    const mockUpdateListItems = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.removeItem(timerUtils.TIMER_SIGNAL_STORAGE_KEY);

        vi.mocked(useAuth).mockReturnValue({
            user: null,
            logout: vi.fn(),
        } as unknown as ReturnType<typeof useAuth>);

        vi.mocked(useWakeLock).mockReturnValue({
            isSupported: true,
            isLocked: false,
            requestWakeLock: vi.fn(),
            releaseWakeLock: vi.fn(),
        });

        vi.mocked(useToast).mockReturnValue({
            showToast: mockShowToast,
        } as unknown as ReturnType<typeof useToast>);

        vi.mocked(useApp).mockReturnValue({
            lists: [
                {
                    id: '1',
                    items: [
                        { id: 'i1', text: 'Milk', completed: false },
                        { id: 'i2', text: 'Eggs', completed: true }
                    ],
                    settings: { defaultSort: 'manual' }
                }
            ],
            defaultListId: '1',
            updateListSettings: vi.fn(),
            updateListItems: mockUpdateListItems,
            theme: 'system',
            setTheme: vi.fn(),
            itemHistory: [],
            updateHistoryItem: vi.fn(),
            deleteFromHistory: vi.fn(),
            clearAllHistory: vi.fn(),
        } as unknown as ReturnType<typeof useApp>);
    });

    it('renders the export list accordion button', () => {
        render(<SettingsView />);
        expect(screen.getByText('settings.exportTitle')).toBeInTheDocument();
    }, 10000);

    it('saves the timer signal selection and previews that signal', () => {
        const playTimerAlert = vi.spyOn(timerUtils, 'playTimerAlert').mockImplementation(() => {});
        const stopTimerAlert = vi.spyOn(timerUtils, 'stopTimerAlert').mockImplementation(() => {});
        render(<SettingsView />);

        const signalSelect = screen.getByLabelText('settings.timerSignal') as HTMLSelectElement;
        expect(signalSelect.value).toBe('classic');
        expect(signalSelect.options).toHaveLength(6);
        fireEvent.change(signalSelect, { target: { value: 'bell' } });
        expect(localStorage.getItem(timerUtils.TIMER_SIGNAL_STORAGE_KEY)).toBe('bell');

        fireEvent.click(screen.getByRole('button', { name: 'settings.previewTimerSignal' }));
        expect(playTimerAlert).toHaveBeenCalledWith('bell', expect.any(Function));
        fireEvent.click(screen.getByRole('button', { name: 'settings.stopTimerSignal' }));
        expect(stopTimerAlert).toHaveBeenCalled();
        playTimerAlert.mockRestore();
        stopTimerAlert.mockRestore();
    });

    it('requests system notification permission from settings', async () => {
        const getPermission = vi.spyOn(timerNotifications, 'getTimerNotificationPermission').mockReturnValue('default');
        const requestPermission = vi.spyOn(timerNotifications, 'requestTimerNotificationPermission')
            .mockResolvedValue('granted');
        render(<SettingsView />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'settings.timerNotificationAction.default' }));
        });

        expect(requestPermission).toHaveBeenCalledOnce();
        expect(screen.getByText('settings.timerNotificationStatus.granted')).toBeInTheDocument();
        getPermission.mockRestore();
        requestPermission.mockRestore();
    });

    it('opens export section and shows active items only by default in simple array format', () => {
        render(<SettingsView />);
        const exportBtn = screen.getByText('settings.exportTitle');
        fireEvent.click(exportBtn);

        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        const parsed = JSON.parse(textarea.value);
        expect(parsed).toEqual(['Milk']);
    });

    it('switches export format to objects format with active items by default', () => {
        render(<SettingsView />);
        const exportBtn = screen.getByText('settings.exportTitle');
        fireEvent.click(exportBtn);

        const objectsFormatBtn = screen.getByText('settings.formatObjects');
        fireEvent.click(objectsFormatBtn);

        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        const parsed = JSON.parse(textarea.value);
        expect(parsed).toEqual([{ text: 'Milk' }]);
    });

    it('switches export format to wrapped format with active items by default', () => {
        render(<SettingsView />);
        const exportBtn = screen.getByText('settings.exportTitle');
        fireEvent.click(exportBtn);

        const wrappedFormatBtn = screen.getByText('settings.formatWrapped');
        fireEvent.click(wrappedFormatBtn);

        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        const parsed = JSON.parse(textarea.value);
        expect(parsed).toEqual({ items: [{ text: 'Milk' }] });
    });

    it('switches scope to all items', () => {
        render(<SettingsView />);
        const exportBtn = screen.getByText('settings.exportTitle');
        fireEvent.click(exportBtn);

        const allScopeBtn = screen.getByText('settings.scopeAll');
        fireEvent.click(allScopeBtn);

        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        const parsed = JSON.parse(textarea.value);
        expect(parsed).toEqual(['Milk', 'Eggs']);
    });

    it('copies export json to clipboard when copy button is clicked', async () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: {
                writeText: writeTextMock,
            },
        });

        render(<SettingsView />);
        const exportBtn = screen.getByText('settings.exportTitle');
        fireEvent.click(exportBtn);

        const copyBtn = screen.getByText('settings.copyJson');
        await act(async () => {
            fireEvent.click(copyBtn);
        });

        expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Milk'));
        expect(mockShowToast).toHaveBeenCalledWith('settings.copied', 'success');
    });

    it('triggers file download when download button is clicked', () => {
        const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
        const revokeObjectURLMock = vi.fn();
        global.URL.createObjectURL = createObjectURLMock;
        global.URL.revokeObjectURL = revokeObjectURLMock;

        const clickMock = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

        render(<SettingsView />);
        const exportBtn = screen.getByText('settings.exportTitle');
        fireEvent.click(exportBtn);

        const downloadBtn = screen.getByText('settings.downloadJson');
        fireEvent.click(downloadBtn);

        expect(createObjectURLMock).toHaveBeenCalled();
        expect(clickMock).toHaveBeenCalled();
        clickMock.mockRestore();
    });

    it('shows simple example JSON format directly in import section', () => {
        render(<SettingsView />);
        const importBtn = screen.getByText('settings.importTitle');
        fireEvent.click(importBtn);

        expect(screen.getByText('settings.jsonFormat')).toBeInTheDocument();
        expect(screen.getByText('[{"text": "Pajdeg", "note": "1st", "checkIfExistAtHome": true}, {"text": "Mjölk", "note": "1liter"}]')).toBeInTheDocument();
    });

    it('successfully imports items with notes from objects format JSON', async () => {
        render(<SettingsView />);
        const importBtn = screen.getByText('settings.importTitle');
        fireEvent.click(importBtn);

        const textarea = screen.getByPlaceholderText('settings.jsonPlaceholder');
        fireEvent.change(textarea, { target: { value: '[{"text": "Oat milk", "note": "Barista"}]' } });

        const submitBtn = screen.getByRole('button', { name: 'common.import' });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(mockUpdateListItems).toHaveBeenCalledWith('1', expect.arrayContaining([
            expect.objectContaining({ text: 'Oat milk', note: 'Barista', completed: false })
        ]));
        expect(mockShowToast).toHaveBeenCalledWith('settings.importSuccess', 'success');
    });

    it('successfully imports items with checkIfExistAtHome from JSON', async () => {
        render(<SettingsView />);
        const importBtn = screen.getByText('settings.importTitle');
        fireEvent.click(importBtn);

        const textarea = screen.getByPlaceholderText('settings.jsonPlaceholder');
        fireEvent.change(textarea, { target: { value: '[{"text": "Kanel", "note": "1 påse", "checkIfExistAtHome": true}, "?Socker"]' } });

        const submitBtn = screen.getByRole('button', { name: 'common.import' });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(mockUpdateListItems).toHaveBeenCalledWith('1', expect.arrayContaining([
            expect.objectContaining({ text: 'Kanel', note: '1 påse', checkIfExistAtHome: true, completed: false }),
            expect.objectContaining({ text: 'Socker', checkIfExistAtHome: true, completed: false })
        ]));
        expect(mockShowToast).toHaveBeenCalledWith('settings.importSuccess', 'success');
    });

    it('successfully imports the user provided complex JSON sample', async () => {
        const userJson = JSON.stringify([
            { "text": "Laxfilé fryst", "note": "500g (Sojalax med bakad spetskål)" },
            { "text": "Spetskål", "note": "1st (Sojalax med bakad spetskål)" },
            { "text": "Japansk sojasås", "note": "1 flaska (Sojalax med bakad spetskål)", "checkIfExistAtHome": true },
            { "text": "Färdiga köttbullar", "note": "500g (Köttbullar med snabbmakaroner)" },
            { "text": "Snabbmakaroner", "note": "1kg (Köttbullar med snabbmakaroner)", "checkIfExistAtHome": true },
            { "text": "Ketchup", "note": "1 flaska (Köttbullar med snabbmakaroner)", "checkIfExistAtHome": true },
            { "text": "Gurka", "note": "1st (Köttbullar med snabbmakaroner)" },
            { "text": "Falukorv", "note": "600g (Korvstroganoff)" },
            { "text": "Gul lök", "note": "1 nät (Korvstroganoff & Halloumistroganoff)", "checkIfExistAtHome": true },
            { "text": "Tomatpuré", "note": "1 tub (Korvstroganoff & Halloumistroganoff)", "checkIfExistAtHome": true },
            { "text": "Matlagningsgrädde", "note": "5dl (Korvstroganoff)" },
            { "text": "Ris", "note": "1kg (Sojalax & Korvstroganoff)", "checkIfExistAtHome": true },
            { "text": "Spaghetti", "note": "500g (Pasta Carbonara)", "checkIfExistAtHome": true },
            { "text": "Bacon", "note": "400g / 3-pack (Pasta Carbonara)" },
            { "text": "Ägg", "note": "6-pack (Pasta Carbonara)", "checkIfExistAtHome": true },
            { "text": "Parmesanost", "note": "150g (Pasta Carbonara)" },
            { "text": "Fiskpinnar", "note": "1 förpackning / ca 450g (Fiskpinnar med potatismos)" },
            { "text": "Potatismos (pulver eller färdigt)", "note": "1 förpackning (Fiskpinnar med potatismos)" },
            { "text": "Gröna ärtor frysta", "note": "1 påse / 250-500g (Fiskpinnar med potatismos)" },
            { "text": "Halloumi", "note": "400g / 2 förpackningar (Halloumistroganoff)" },
            { "text": "Röd paprika", "note": "1st (Halloumistroganoff)" },
            { "text": "Krossade tomater", "note": "400g (Halloumistroganoff)", "checkIfExistAtHome": true },
            { "text": "Bulgur", "note": "1 förpackning (Halloumistroganoff)", "checkIfExistAtHome": true },
            { "text": "Majskolvar", "note": "4st (Elotes & kycklingquesadillas)" },
            { "text": "Majonnäs", "note": "1 tub (Elotes & kycklingquesadillas)", "checkIfExistAtHome": true },
            { "text": "Smetana", "note": "2dl (Elotes & kycklingquesadillas)" },
            { "text": "Fetaost", "note": "150g (Elotes & kycklingquesadillas)" },
            { "text": "Lime", "note": "2st (Elotes & kycklingquesadillas)" },
            { "text": "Chilipulver eller Tajín", "note": "1 burk (Elotes & kycklingquesadillas)", "checkIfExistAtHome": true },
            { "text": "Tortillabröd", "note": "1 förpackning / 8-pack (Elotes & kycklingquesadillas)" },
            { "text": "Strimlad färdig kyckling", "note": "400g (Elotes & kycklingquesadillas)" },
            { "text": "Riven ost", "note": "200g (Elotes & kycklingquesadillas)" }
        ]);

        render(<SettingsView />);
        const importBtn = screen.getByText('settings.importTitle');
        fireEvent.click(importBtn);

        const textarea = screen.getByPlaceholderText('settings.jsonPlaceholder');
        fireEvent.change(textarea, { target: { value: userJson } });

        const submitBtn = screen.getByRole('button', { name: 'common.import' });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(mockUpdateListItems).toHaveBeenCalledWith('1', expect.arrayContaining([
            expect.objectContaining({ text: 'Laxfilé fryst', note: '500g (Sojalax med bakad spetskål)', completed: false }),
            expect.objectContaining({ text: 'Japansk sojasås', checkIfExistAtHome: true, completed: false }),
            expect.objectContaining({ text: 'Riven ost', note: '200g (Elotes & kycklingquesadillas)', completed: false })
        ]));
        expect(mockShowToast).toHaveBeenCalledWith('settings.importSuccess', 'success');
    });

    it('clears all items when clear all button is clicked and confirmed', async () => {
        render(<SettingsView />);
        const clearBtn = screen.getByText('common.clearAll');
        fireEvent.click(clearBtn);

        expect(screen.getByText('common.confirmDeleteAll')).toBeInTheDocument();
        
        const confirmBtn = screen.getByText('common.delete');
        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        expect(mockUpdateListItems).toHaveBeenCalledWith('1', []);
        expect(mockShowToast).toHaveBeenCalledWith('common.cleared', 'success');
    });
});
