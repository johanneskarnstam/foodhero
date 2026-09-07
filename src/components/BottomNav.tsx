import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, CalendarDays, ChefHat, MoreHorizontal, X, SquareCheck, Settings, Activity, BarChart3, History, Search, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BottomNavProps {
    onMoreOpen?: () => void;
    onNavigate?: () => void;
    style?: React.CSSProperties;
}

interface MoreDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const secondaryItems = [
        { path: '/todos', icon: SquareCheck, label: t('nav.todos', 'Att göra') },
        { path: '/ingredients', icon: Search, label: t('ingredientSearch.title', 'Sök på ingrediens') },
        { path: '/activity', icon: Activity, label: t('history.title', 'Aktivitet') },
        { path: '/statistics', icon: BarChart3, label: t('history.statistics', 'Statistik') },
        { path: '/history', icon: History, label: t('history.suggestionHistory', 'Historik') },
        { path: '/settings', icon: Settings, label: t('nav.settings', 'Inställningar') },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                data-testid="drawer-backdrop"
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
                onClick={onClose}
            />
            {/* Drawer */}
            <div className="fixed bottom-14 left-0 right-0 z-50 md:hidden animate-in slide-in-from-bottom-4 duration-250">
                <div className="mx-3 mb-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('nav.more', 'Mer')}</span>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div className="p-2">
                        {secondaryItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium"
                            >
                                <item.icon size={19} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export const BottomNav: React.FC<BottomNavProps> = ({ onMoreOpen, onNavigate, style }) => {
    const { t } = useTranslation();

    const primaryTabs = [
        {
            path: '/',
            icon: LayoutGrid,
            label: t('nav.home', 'Hem'),
            exact: true,
        },
        {
            path: '/shopping',
            icon: ShoppingCart,
            label: t('nav.shopping', 'Inköp'),
            exact: false,
        },
        {
            path: '/mealplan',
            icon: CalendarDays,
            label: t('nav.mealplan', 'Matsedel'),
            exact: false,
        },
        {
            path: '/meals',
            icon: ChefHat,
            label: t('nav.meals', 'Recept'),
            exact: false,
        },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)', ...style }}
        >
            <div className="bg-white/80 dark:bg-gray-900/85 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-800/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
                <div className="flex items-stretch h-14">
                    {primaryTabs.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            end={tab.exact}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                                `flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 relative ${
                                    isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <tab.icon
                                        size={22}
                                        className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                                        strokeWidth={isActive ? 2.2 : 1.8}
                                    />
                                    <span className={`text-[10px] font-medium leading-none ${isActive ? 'font-semibold' : ''}`}>
                                        {tab.label}
                                    </span>
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}

                    {/* More button */}
                    <button
                        onClick={onMoreOpen}
                        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <MoreHorizontal size={22} strokeWidth={1.8} />
                        <span className="text-[10px] font-medium leading-none">{t('nav.more', 'Mer')}</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};
