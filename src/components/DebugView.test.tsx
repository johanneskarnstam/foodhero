import React from 'react';
import { render, screen } from '@testing-library/react';
import { DebugView } from './DebugView';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Bug: () => <svg data-testid="bug-icon" />,
    Smartphone: () => <svg data-testid="smartphone-icon" />,
    Monitor: () => <svg data-testid="monitor-icon" />,
    Globe: () => <svg data-testid="globe-icon" />,
    Cpu: () => <svg data-testid="cpu-icon" />,
    Chrome: () => <svg data-testid="chrome-icon" />,
}));

// Mock useTranslation
const mockT = (key: string) => {
    const translations: Record<string, string> = {
        'debug.title': 'Debug Info',
        'debug.subtitle': 'Technical device information',
        'debug.loading': 'Loading device information...',
        'debug.deviceType': 'Device Type',
        'debug.mobile': 'Mobile',
        'debug.tablet': 'Tablet',
        'debug.desktop': 'Desktop',
        'debug.manufacturer': 'Manufacturer',
        'debug.modelName': 'Model Name',
        'debug.platform': 'Platform',
        'debug.screenInfo': 'Screen Information',
        'debug.screenResolution': 'Screen Resolution',
        'debug.windowSize': 'Window Size',
        'debug.pixelRatio': 'Pixel Ratio',
        'debug.aspectRatio': 'Aspect Ratio',
        'debug.browserInfo': 'Browser Information',
        'debug.browserName': 'Browser',
        'debug.browserVersion': 'Version',
        'debug.osInfo': 'Operating System',
        'debug.osName': 'OS Name',
        'debug.osVersion': 'Version',
        'debug.timeZone': 'Time Zone',
        'debug.language': 'Language',
        'debug.hardwareInfo': 'Hardware Information',
        'debug.cpuCores': 'CPU Cores',
        'debug.touchSupport': 'Touch Support',
        'debug.isOnline': 'Online',
        'debug.notAvailable': 'Not available',
        'debug.yes': 'Yes',
        'debug.no': 'No'
    };
    return translations[key] || key;
};

// Mock useTranslation hook
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: mockT }),
}));

describe('DebugView', () => {
    beforeEach(() => {
        // Mock navigator properties
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
        Object.defineProperty(screen, 'width', { writable: true, configurable: true, value: 1920 });
        Object.defineProperty(screen, 'height', { writable: true, configurable: true, value: 1080 });
        Object.defineProperty(window, 'devicePixelRatio', { writable: true, configurable: true, value: 2 });
        Object.defineProperty(navigator, 'userAgent', { writable: true, configurable: true, value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' });
        Object.defineProperty(navigator, 'platform', { writable: true, configurable: true, value: 'Win32' });
        Object.defineProperty(navigator, 'onLine', { writable: true, configurable: true, value: true });
        Object.defineProperty(navigator, 'language', { writable: true, configurable: true, value: 'en-US' });
        Object.defineProperty(navigator, 'languages', { writable: true, configurable: true, value: ['en-US', 'en'] });
        Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, configurable: true, value: 0 });
        Object.defineProperty(navigator, 'hardwareConcurrency', { writable: true, configurable: true, value: 8 });
        Object.defineProperty(screen, 'colorDepth', { writable: true, configurable: true, value: 24 });
        Object.defineProperty(screen, 'orientation', { writable: true, configurable: true, value: { type: 'landscape' } });
    });

    it('should render loading state initially', () => {
        render(
            <MemoryRouter>
                <DebugView />
            </MemoryRouter>
        );
        
        expect(screen.getByText(/Debug Info|Loading/i)).toBeInTheDocument();
    });

    it('should render the main title', () => {
        render(
            <MemoryRouter>
                <DebugView />
            </MemoryRouter>
        );
        
        expect(screen.getByText('Debug Info')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
        render(
            <MemoryRouter>
                <DebugView />
            </MemoryRouter>
        );
        
        expect(screen.getByRole('heading', { name: 'Debug Info' })).toBeInTheDocument();
    });
});