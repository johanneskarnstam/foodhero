import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Moon, Sun, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { OfflineIndicator } from './OfflineIndicator';
import { SyncIndicator } from './SyncIndicator';
import { useWakeLock } from '../hooks/useWakeLock';
import { ShoppingListOverlay } from './ShoppingListOverlay';
import { BottomNav, MoreDrawer } from './BottomNav';
import { ToastContainer } from './ToastContainer';
import { UpdatePrompt } from './UpdatePrompt';
import { useToast } from '../context/ToastContext';

export const Layout: React.FC = () => {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useApp();
    const { isSupported, isLocked, requestWakeLock, releaseWakeLock } = useWakeLock();
    const { showToast } = useToast();
    const location = useLocation();
    
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isShoppingListViewOpen, setIsShoppingListViewOpen] = useState(false);

    const isHomePage = location.pathname === '/';

    // Close shopping list overlay if navigating away from home page
    useEffect(() => {
        if (!isHomePage && isShoppingListViewOpen) {
            setIsShoppingListViewOpen(false);
        }
    }, [isHomePage, isShoppingListViewOpen]);

    const handleEyeButtonClick = () => {
        if (isHomePage) {
            if (!isShoppingListViewOpen) {
                requestWakeLock();
                setIsShoppingListViewOpen(true);
            } else {
                releaseWakeLock();
                setIsShoppingListViewOpen(false);
            }
        } else {
            if (isLocked) {
                releaseWakeLock();
                showToast(t('settings.wakeLockDisabled', 'Skärmlås avaktiverat'), 'info');
            } else {
                requestWakeLock();
                showToast(t('settings.wakeLockActive', 'Skärmen hålls vaken'), 'info');
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-x-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 flex-shrink-0 fixed top-0 left-0 h-screen z-20">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0 md:ml-72">
                <OfflineIndicator />
                <SyncIndicator />

                {/* Mobile Header */}
                <header className="md:hidden sticky top-0 z-10 glass p-3 flex items-center justify-between border-b border-gray-200/60 dark:border-gray-800/60">
                    <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <img src="/buymilk/favicon.png" alt="Logo" className="w-9 h-9 rounded-xl shadow-sm" />
                        <h1 className="text-2xl font-bold text-[#2c6de3]">BuyMilk</h1>
                    </Link>
                    <div className="flex items-center gap-1.5">
                        {isSupported && (
                            <button
                                onClick={handleEyeButtonClick}
                                className={`p-2 rounded-full transition-colors ${
                                    isLocked
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                title={t('settings.wakeLock', 'Håll skärmen vaken')}
                                aria-label={t('settings.wakeLock', 'Håll skärmen vaken')}
                            >
                                <Eye size={20} />
                            </button>
                        )}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                            aria-label={t('app.toggleTheme')}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                    </div>
                </header>

                {/* Main Scrollable Content — pb-20 on mobile to clear bottom nav */}
                <main className="flex-1 p-4 w-full mx-auto md:p-8 md:max-w-7xl pb-20 md:pb-8 min-w-0">
                    <Outlet context={{ isMoreOpen }} />
                </main>

                <ShoppingListOverlay
                    isOpen={isShoppingListViewOpen}
                    onClose={() => {
                        setIsShoppingListViewOpen(false);
                        releaseWakeLock();
                    }}
                    isWakeLockActive={isLocked}
                />
            </div>

            {/* Mobile Bottom Nav */}
            <BottomNav onMoreOpen={() => setIsMoreOpen(true)} onNavigate={() => setIsMoreOpen(false)} style={{ zIndex: 110 }} />
            <MoreDrawer isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
            <ToastContainer />
            <UpdatePrompt />
        </div>
    );
};
