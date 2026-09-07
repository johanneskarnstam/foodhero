import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import { Layout } from './Layout';
import { useApp } from '../context/AppContext';
import { useWakeLock } from '../hooks/useWakeLock';
import { useToast } from '../context/ToastContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../context/AppContext');
vi.mock('../hooks/useWakeLock');
vi.mock('../context/ToastContext');
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}));

describe('Layout route-aware WakeLock', () => {
    const mockRequestWakeLock = vi.fn();
    const mockReleaseWakeLock = vi.fn();
    const mockShowToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useApp).mockReturnValue({
            theme: 'light',
            toggleTheme: vi.fn(),
            isSyncing: false,
            lists: [{ id: 'default', items: [], settings: {}, isPending: false }],
            defaultListId: 'default',
            updateListItems: vi.fn(),
        } as unknown as ReturnType<typeof useApp>);

        vi.mocked(useToast).mockReturnValue({
            showToast: mockShowToast,
            toasts: [],
            removeToast: vi.fn(),
        });

        vi.mocked(useWakeLock).mockReturnValue({
            isSupported: true,
            isLocked: false,
            requestWakeLock: mockRequestWakeLock,
            releaseWakeLock: mockReleaseWakeLock,
        });
    });

    it('opens shopping list overlay and requests wake lock when eye button is clicked on shopping page (/shopping)', () => {
        render(
            <MemoryRouter initialEntries={['/shopping']}>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/shopping" element={<div>Shopping View</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        const eyeButton = screen.getByTitle('Håll skärmen vaken');
        fireEvent.click(eyeButton);

        expect(mockRequestWakeLock).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Inköpslista')).toBeInTheDocument();
        expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('closes shopping list overlay and releases wake lock when eye button is clicked again on shopping page (/shopping)', () => {
        render(
            <MemoryRouter initialEntries={['/shopping']}>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/shopping" element={<div>Shopping View</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        const eyeButton = screen.getByTitle('Håll skärmen vaken');
        // Open
        fireEvent.click(eyeButton);
        expect(screen.getByText('Inköpslista')).toBeInTheDocument();

        // Close
        fireEvent.click(eyeButton);
        expect(mockReleaseWakeLock).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Inköpslista')).not.toBeInTheDocument();
    });

    it('toggles wake lock directly and shows toast without opening overlay when on other pages (/meals)', () => {
        render(
            <MemoryRouter initialEntries={['/meals']}>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/meals" element={<div>Meals View</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        const eyeButton = screen.getByTitle('Håll skärmen vaken');
        fireEvent.click(eyeButton);

        expect(mockRequestWakeLock).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Inköpslista')).not.toBeInTheDocument();
        expect(mockShowToast).toHaveBeenCalledWith('Skärmen hålls vaken', 'info');
    });

    it('releases wake lock and shows disabled toast when already locked on other pages (/meals)', () => {
        vi.mocked(useWakeLock).mockReturnValue({
            isSupported: true,
            isLocked: true,
            requestWakeLock: mockRequestWakeLock,
            releaseWakeLock: mockReleaseWakeLock,
        });

        render(
            <MemoryRouter initialEntries={['/meals']}>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/meals" element={<div>Meals View</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        const eyeButton = screen.getByTitle('Håll skärmen vaken');
        fireEvent.click(eyeButton);

        expect(mockReleaseWakeLock).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Inköpslista')).not.toBeInTheDocument();
        expect(mockShowToast).toHaveBeenCalledWith('Skärmlås avaktiverat', 'info');
    });
});
