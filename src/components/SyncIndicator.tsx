import React, { useEffect, useState } from 'react';
import { Cloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export const SyncIndicator: React.FC = () => {
    const { t } = useTranslation();
    const { isSyncing, pendingChanges } = useApp();
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOnline || !isSyncing) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
            <Cloud size={16} className="animate-pulse" />
            <span>
                {pendingChanges > 0
                    ? t('common.syncingWithCount', 'Syncing {{count}} change...', { count: pendingChanges })
                    : t('common.syncing', 'Syncing changes...')}
            </span>
        </div>
    );
};