import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getTimerNotificationPermission,
    requestTimerNotificationPermission,
    showRecipeTimerNotification,
} from './timerNotifications';

describe('timerNotifications', () => {
    const originalNotification = Object.getOwnPropertyDescriptor(window, 'Notification');

    class MockNotification {
        static permission: NotificationPermission = 'default';
        static requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
        static instances: MockNotification[] = [];
        onclick: ((event: Event) => void) | null = null;
        close = vi.fn();

        constructor(public title: string, public options?: NotificationOptions) {
            MockNotification.instances.push(this);
        }
    }

    beforeEach(() => {
        MockNotification.permission = 'default';
        MockNotification.requestPermission.mockClear();
        MockNotification.instances = [];
        Object.defineProperty(window, 'Notification', {
            configurable: true,
            value: MockNotification,
        });
    });

    afterEach(() => {
        if (originalNotification) {
            Object.defineProperty(window, 'Notification', originalNotification);
        } else {
            Reflect.deleteProperty(window, 'Notification');
        }
    });

    it('requests permission only while it is undecided', async () => {
        expect(getTimerNotificationPermission()).toBe('default');
        await expect(requestTimerNotificationPermission()).resolves.toBe('granted');
        expect(MockNotification.requestPermission).toHaveBeenCalledOnce();

        MockNotification.permission = 'denied';
        await expect(requestTimerNotificationPermission()).resolves.toBe('denied');
        expect(MockNotification.requestPermission).toHaveBeenCalledOnce();
    });

    it('shows a system notification when permission is granted', async () => {
        MockNotification.permission = 'granted';

        await expect(showRecipeTimerNotification({
            id: 'timer-1',
            title: 'Timer klar',
            body: 'Steg 2 är klart: 10 min',
        })).resolves.toBe(true);

        expect(MockNotification.instances).toHaveLength(1);
        expect(MockNotification.instances[0].options?.body).toContain('10 min');
        expect(MockNotification.instances[0].title).toBe('Timer klar');
        expect(MockNotification.instances[0].options?.tag).toBe('recipe-timer-timer-1');
    });

    it('does not show a notification without permission', async () => {
        await expect(showRecipeTimerNotification({
            id: 'timer-1',
            title: 'Timer klar',
            body: 'Steg 1 är klart: 5 min',
        })).resolves.toBe(false);
        expect(MockNotification.instances).toHaveLength(0);
    });
});