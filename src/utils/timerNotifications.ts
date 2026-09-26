export type TimerNotificationPermission = NotificationPermission | 'unsupported';

interface TimerNotificationDetails {
    id: string;
    title: string;
    body: string;
}

export const getTimerNotificationPermission = (): TimerNotificationPermission => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
};

export const requestTimerNotificationPermission = async (): Promise<TimerNotificationPermission> => {
    if (getTimerNotificationPermission() !== 'default') {
        return getTimerNotificationPermission();
    }

    try {
        return await Notification.requestPermission();
    } catch {
        return getTimerNotificationPermission();
    }
};

export const showRecipeTimerNotification = async (timer: TimerNotificationDetails): Promise<boolean> => {
    if (getTimerNotificationPermission() !== 'granted') return false;

    const options: NotificationOptions = {
        body: timer.body,
        icon: new URL(`${import.meta.env.BASE_URL}pwa-192x192.png`, window.location.origin).toString(),
        tag: `recipe-timer-${timer.id}`,
        requireInteraction: true,
        data: { url: window.location.href },
    };

    try {
        const registration = 'serviceWorker' in navigator
            ? await navigator.serviceWorker.getRegistration()
            : undefined;
        if (registration) {
            await registration.showNotification(timer.title, options);
        } else {
            const notification = new Notification(timer.title, options);
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
        return true;
    } catch {
        return false;
    }
};