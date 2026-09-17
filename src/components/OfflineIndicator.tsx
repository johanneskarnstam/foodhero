import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export const OfflineIndicator: React.FC = () => {
    const { t } = useTranslation();
    const { pendingChanges } = useApp();
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
            <WifiOff size={16} />
            <span>
                {t('common.offlineMode', 'You are currently offline. Changes will be saved locally and synced when you reconnect.')}
                {pendingChanges > 0 && ` ${t('common.unsyncedChanges', '{{count}} unsynced changes.', { count: pendingChanges })}`}
            </span>
        </div>
    );
};
