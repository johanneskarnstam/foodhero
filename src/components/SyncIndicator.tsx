import React from 'react';
import { Cloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export const SyncIndicator: React.FC = () => {
    const { t } = useTranslation();
    const { isSyncing, lists, todos, categories, meals, mealPlans } = useApp();

    if (!isSyncing) return null;

    // Count pending changes
    const allItems = [
        ...lists,
        ...todos,
        ...categories,
        ...meals,
        ...mealPlans
    ] as Array<{ isPending?: boolean }>;
    const pendingCount = allItems.filter((item) => item.isPending).length;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
            <Cloud size={16} className="animate-pulse" />
            <span>
                {pendingCount > 0
                    ? t('common.syncingWithCount', 'Syncing {{count}} change...', { count: pendingCount })
                    : t('common.syncing', 'Syncing changes...')}
            </span>
        </div>
    );
};